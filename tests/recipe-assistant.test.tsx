// @vitest-environment jsdom
import {afterEach,beforeEach,describe,it,expect,vi} from "vitest";
import {cleanup,render,screen,fireEvent,within} from "@testing-library/react";
import {Meals} from "../src/components/Nutrition";
import {FitStore} from "../src/lib/store";
vi.mock("../src/lib/client",()=>({supabase:{}}));
beforeEach(()=>{localStorage.clear();Object.defineProperty(navigator,"onLine",{configurable:true,value:false});});
afterEach(()=>cleanup());
function store(){const result=new FitStore("recipe-qa");result.save("user_profiles",{nutritionPreferences:{preference:"omnivore",excluded:[],dietaryRestrictions:[],favoriteIngredients:[]}});return result;}
function ask(text:string){fireEvent.change(screen.getByRole("textbox",{name:"Mensaje para asistente de recetas"}),{target:{value:text}});fireEvent.click(screen.getByRole("button",{name:"Buscar ideas"}));}
function open(store:FitStore,date="2026-11-12"){const view=render(<Meals store={store} date={date}/>);fireEvent.click(screen.getByRole("button",{name:"Cocina PR"}));return view;}
describe("asistente de recetas local y persistente",()=>{
  it("busca ingredientes, edita gramos, guarda y registra una vez con la fecha del borrador",()=>{
    const s=store();const view=open(s);
    expect(screen.getByText(/No utilizo un modelo de IA/)).toBeTruthy();
    ask("Tengo arroz, habichuelas, pollo, tomate y aceite");
    const card=screen.getByRole("heading",{name:"Arroz, habichuelas y pechuga"}).closest("article")!;
    fireEvent.change(within(card).getByRole("spinbutton",{name:"Cantidad de receta Arroz blanco"}),{target:{value:"185"}});
    fireEvent.click(within(card).getByRole("button",{name:"Guardar receta"}));
    expect(s.list("recipes")[0].data.items.find((entry:{foodId:string})=>entry.foodId==="rice").amount).toBe(185);
    expect(s.list("recipe_ingredients")).toHaveLength(5);
    view.rerender(<Meals store={s} date="2026-11-13"/>);
    fireEvent.click(within(card).getByRole("button",{name:"Consumí esta porción"}));
    expect(s.list("food_logs")).toHaveLength(5);
    expect(s.list("food_logs").every(row=>row.local_date==="2026-11-12")).toBe(true);
    expect(s.list("food_logs").find(row=>row.data.foodId==="rice")?.data.kcal).toBe(240.5);
    fireEvent.click(within(card).getByRole("button",{name:"Registrado"}));
    expect(s.list("food_logs")).toHaveLength(5);
    expect(new FitStore("recipe-qa").list("recipes")).toHaveLength(1);
  });
  it("guarda alergias/intolerancias/favoritos y omite resultados antiguos",()=>{
    const s=store();open(s);ask("Tengo arroz y pollo");
    fireEvent.click(screen.getByRole("checkbox",{name:"Leche y lácteos"}));
    fireEvent.click(screen.getByRole("checkbox",{name:"Evitar lactosa"}));
    fireEvent.click(screen.getAllByRole("checkbox",{name:"Arroz blanco"})[0]);
    fireEvent.click(screen.getByRole("button",{name:"Guardar preferencias"}));
    const data=s.list("user_profiles")[0].data.nutritionPreferences;
    expect(data.excluded).toContain("dairy");expect(data.dietaryRestrictions).toContain("lactose");expect(data.favoriteIngredients).toContain("rice");
    expect(screen.queryByRole("heading",{name:"Arroz, habichuelas y pechuga"})).toBeNull();
    ask("Dame ideas de desayuno sin gluten");
    expect(screen.queryByRole("spinbutton",{name:/Cantidad de receta Leche/})).toBeNull();
    expect(screen.queryByRole("spinbutton",{name:/Cantidad de receta Avena/})).toBeNull();
  });
  it("no finge conocer ingredientes ni genera ideas para perfiles con revisión pendiente",()=>{
    const s=store();const view=open(s);ask("Solo tengo aguacate");
    expect(screen.getByText(/No reconocí un ingrediente disponible/)).toBeTruthy();expect(screen.queryAllByRole("button",{name:"Consumí esta porción"})).toHaveLength(0);
    view.unmount();const row=s.list("user_profiles")[0];s.save("user_profiles",{...row.data,guideBlocked:true},{id:row.id});open(s);
    expect(screen.getByRole("heading",{name:"Recetas pendientes de orientación"})).toBeTruthy();expect(screen.queryByRole("textbox",{name:"Mensaje para asistente de recetas"})).toBeNull();
  });
});
