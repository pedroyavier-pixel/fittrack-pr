import {useState,type FormEvent} from 'react';
import {type FitStore,seedId} from '../lib/store';
export function NamePrompt({store}:{store:FitStore}){
 const row=store.list('user_profiles')[0];
 const [name,setName]=useState('');const [error,setError]=useState('');
 if(row?.data.name?.trim() && row.data.name.trim()!=='Atleta')return null;
 function save(event:FormEvent){event.preventDefault();const value=name.trim();if(!value||value.length>60||/[\u0000-\u001f\u007f]/.test(value)){setError('Escribe un nombre o apodo de hasta 60 caracteres.');return;}
  try{store.save('user_profiles',{...row?.data,name:value},{id:row?.id||seedId(store.userId,'profile')});setError('');}catch(e){setError(e instanceof Error?e.message:'No se pudo guardar tu nombre.');}
 }
 return <form className="card stack" onSubmit={save}><label className="field">¿Cómo quieres que te llamemos?<input autoComplete="given-name" maxLength={60} required value={name} onChange={event=>setName(event.target.value)} placeholder="Tu nombre o apodo"/></label><button className="btn primary" type="submit">Guardar mi nombre</button>{error&&<p className="danger" role="alert">{error}</p>}</form>;
}
