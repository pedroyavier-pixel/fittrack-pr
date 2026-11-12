import {describe,it,expect} from 'vitest';
import {normalizeLoad} from '../src/lib/loads';
describe('registro explícito de cargas',()=>{
 it('suma discos de ambos lados y peso real de barra, sin asumir45lb',()=>{
  expect(normalizeLoad(25,'bar_sides',35)).toMatchObject({weightLb:85,totalLoadLb:85,enteredWeightLb:25,barWeightLb:35});
  expect(()=>normalizeLoad(25,'bar_sides')).toThrow();
 });
 it('conserva carga por mano para comparar y calcula total de dos mancuernas',()=>{
  expect(normalizeLoad(30,'per_hand')).toMatchObject({weightLb:30,totalLoadLb:60});
  expect(normalizeLoad(30,'total')).toMatchObject({weightLb:30,totalLoadLb:30});
 });
 it('no suma resistencias de máquinas desconocidas y rechaza valores inválidos',()=>{
  expect(normalizeLoad(20,'per_side').totalLoadLb).toBe(40);
  for(const v of [-1,Infinity,NaN])expect(()=>normalizeLoad(v,'total')).toThrow();
 });
});
