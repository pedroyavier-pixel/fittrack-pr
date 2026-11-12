import {it,expect} from 'vitest';
import {exercises} from '../src/data/training';
import {exerciseVariants} from '../src/data/exerciseVariants';
it('todos los movimientos tienen exactamente dos alternativas existentes y diferentes',()=>{
 const ids=new Set(exercises.map(e=>e.id));
 for(const e of exercises){
  const alternatives=exerciseVariants[e.id];
  expect(alternatives,e.id).toHaveLength(2);
  expect(new Set([e.id,...alternatives]).size,e.id).toBe(3);
  for(const id of alternatives)expect(ids.has(id),`${e.id} -> ${id}`).toBe(true);
 }
});
