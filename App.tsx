import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Pressable, SafeAreaView, ScrollView, StyleSheet,
  Text, TextInput, View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";

type Grade = "A" | "B" | "C";
type Category = "Base" | "Avancée" | "Super";

type DiceRule = { dice: number; faces: number; modifier: number };
type DiceSet = { A: DiceRule; B: DiceRule; C: DiceRule; minimum: number };

type ClassDef = {
  id: string; name: string; category: Category;
  grades: Record<string, Grade>;
};

type SubRace = { id: string; name: string; weight: number; description: string };
type Race = { id: string; name: string; weight: number; description: string; subRaces?: SubRace[] };
type NPC = {
  id: string; name: string; race: string; className: string; category: Category;
  stats: Record<string, number>; grades: Record<string, Grade>;
  total: number; level: number; palier: number; subRace?: string;
};

const STATS = ["Force","Dextérité","Agilité","Constitution","Intelligence","Chance"];

const DEFAULT_DICE: Record<Category, DiceSet> = {
  Base: { A:{dice:1,faces:6,modifier:0}, B:{dice:1,faces:4,modifier:0}, C:{dice:1,faces:3,modifier:-1}, minimum:0 },
  Avancée: { A:{dice:2,faces:6,modifier:0}, B:{dice:2,faces:4,modifier:-1}, C:{dice:2,faces:3,modifier:-2}, minimum:16 },
  Super: { A:{dice:3,faces:6,modifier:0}, B:{dice:3,faces:4,modifier:-2}, C:{dice:3,faces:3,modifier:-3}, minimum:26 }
};

const DEFAULT_RACES: Race[] = [
  {id:"humain",name:"Humain",weight:500,description:"La population la plus répandue de l'Empire.",subRaces:[]},
  {id:"kobold",name:"Kobold",weight:250,description:"Petit peuple rusé, très présent dans l'Empire.",subRaces:[]},
  {id:"elfe",name:"Elfe",weight:150,description:"Peuple ancien, élégant et souvent mystérieux.",subRaces:[]},
  {id:"nain",name:"Nain",weight:100,description:"Robustes artisans et guerriers.",subRaces:[]}
];

const DEFAULT_NAMES = ["Gérard","Ragnar","Thorvald","Mireille","Grom","Léon","Berthe","Alrik","Kevin","Brindille"];

const DEFAULT_CLASSES: ClassDef[] = [
  {id:"aventurier",name:"Aventurier",category:"Base",
   grades:{Force:"A",Dextérité:"B",Agilité:"C",Constitution:"C",Intelligence:"C",Chance:"C"}},
  {id:"guerrier",name:"Guerrier",category:"Avancée",
   grades:{Force:"A",Dextérité:"B",Agilité:"B",Constitution:"A",Intelligence:"C",Chance:"C"}},
  {id:"heros",name:"Héros",category:"Super",
   grades:{Force:"A",Dextérité:"A",Agilité:"B",Constitution:"A",Intelligence:"B",Chance:"C"}}
];

const K = {
  dice:"rb.dice.v1", races:"rb.races.v1", classes:"rb.classes.v1",
  names:"rb.names.v1", npcs:"rb.npcs.v1"
};

function rand(max:number){ return Math.floor(Math.random()*max)+1; }
function roll(rule:DiceRule){ let n=0; for(let i=0;i<rule.dice;i++) n+=rand(rule.faces); return n+rule.modifier; }
function weighted<T extends {weight:number}>(races:T[]){ const total=races.reduce((s,r)=>s+Math.max(0,r.weight),0); if(!total)return races[0]; let x=Math.random()*total; for(const r of races){x-=Math.max(0,r.weight);if(x<0)return r;} return races[races.length-1];}
function makeStats(c:ClassDef,dice:Record<Category,DiceSet>){
  let result:Record<string,number>;
  do {
    result={};
    for(const s of STATS) result[s]=roll(dice[c.category][c.grades[s]]);
  } while(Object.values(result).reduce((a,b)=>a+b,0)<dice[c.category].minimum);
  return result;
}
function getPalier(level:number){ return Math.floor(level/10)+1; }
function makeNPC(c:ClassDef,r:Race,names:string[],dice:Record<Category,DiceSet>,manualName?:string,subRace?:SubRace):NPC{
  const stats=makeStats(c,dice); const total=Object.values(stats).reduce((a,b)=>a+b,0);
  const level=(total-6)*3+1;
  return {id:Date.now().toString()+Math.random(),name:manualName?.trim()||names[Math.floor(Math.random()*names.length)]||"PNJ",race:r.name,subRace:subRace?.name,className:c.name,category:c.category,stats,grades:{...c.grades},total,level,palier:getPalier(level)};
}

function selectedRacesWithSubs(races:Race[],choices:string[]){ const selected=choices.length?races.filter(r=>choices.includes(r.id)):races; return selected.filter(r=>(r.subRaces||[]).length>0); }

export default function App(){
  const [dice,setDice]=useState(DEFAULT_DICE);
  const [races,setRaces]=useState(DEFAULT_RACES);
  const [classes,setClasses]=useState(DEFAULT_CLASSES);
  const [names,setNames]=useState(DEFAULT_NAMES);
  const [npcs,setNpcs]=useState<NPC[]>([]);
  const [current,setCurrent]=useState<NPC|null>(null);
  const [tab,setTab]=useState("Générer");
  const [raceChoices,setRaceChoices]=useState<string[]>([]);
  const [subRaceChoices,setSubRaceChoices]=useState<Record<string,string[]>>({});
  const [classChoices,setClassChoices]=useState<string[]>([]);
  const [nameChoice,setNameChoice]=useState("");
  const [loaded,setLoaded]=useState(false);
  const [bulkSubRaces,setBulkSubRaces]=useState<Record<string,string>>({});

  useEffect(()=>{(async()=>{
    try{
      const get=async<T,>(key:string,def:T)=>{const x=await AsyncStorage.getItem(key);return x?JSON.parse(x):def};
      setDice(await get(K.dice,DEFAULT_DICE)); setRaces(await get(K.races,DEFAULT_RACES));
      setClasses(await get(K.classes,DEFAULT_CLASSES)); setNames(await get(K.names,DEFAULT_NAMES));
      const savedNpcs=await get<NPC[]>(K.npcs,[]); setNpcs(savedNpcs.map(n=>{const level=(n.level??((n.total-6)*3+1));return {...n,level,palier:n.palier??getPalier(level)};})); setLoaded(true);
    }catch(e){Alert.alert("Erreur","Impossible de charger les données.");}
  })()},[]);
  useEffect(()=>{if(loaded)AsyncStorage.setItem(K.dice,JSON.stringify(dice))},[dice,loaded]);
  useEffect(()=>{if(loaded)AsyncStorage.setItem(K.races,JSON.stringify(races))},[races,loaded]);
  useEffect(()=>{if(loaded)AsyncStorage.setItem(K.classes,JSON.stringify(classes))},[classes,loaded]);
  useEffect(()=>{if(loaded)AsyncStorage.setItem(K.names,JSON.stringify(names))},[names,loaded]);
  useEffect(()=>{if(loaded)AsyncStorage.setItem(K.npcs,JSON.stringify(npcs))},[npcs,loaded]);

  const toggleRace=(id:string)=>setRaceChoices(xs=>xs.includes(id)?xs.filter(x=>x!==id):[...xs,id]);
  const selectAllRaces=()=>setRaceChoices(xs=>xs.length===races.length?[]:races.map(r=>r.id));
  const toggleSubRace=(raceId:string,subId:string)=>setSubRaceChoices(all=>{const xs=all[raceId]||[];return {...all,[raceId]:xs.includes(subId)?xs.filter(x=>x!==subId):[...xs,subId]};});
  const selectAllSubRaces=(raceId:string,subs:SubRace[])=>setSubRaceChoices(all=>{const xs=all[raceId]||[];return {...all,[raceId]:xs.length===subs.length?[]:subs.map(s=>s.id)};});
  const toggleClass=(id:string)=>setClassChoices(xs=>xs.includes(id)?xs.filter(x=>x!==id):[...xs,id]);
  const toggleClassCategory=(cat:Category)=>{const ids=classes.filter(c=>c.category===cat).map(c=>c.id);setClassChoices(xs=>ids.length&&ids.every(id=>xs.includes(id))?xs.filter(id=>!ids.includes(id)):[...new Set([...xs,...ids])]);};
  const generate=()=>{
    if(!classes.length||!races.length||!names.length){Alert.alert("Données manquantes","Ajoute au moins une race, une classe et un nom.");return;}
    const selectedRaces=raceChoices.length?races.filter(r=>raceChoices.includes(r.id)):races;
    const selectedClasses=classChoices.length?classes.filter(c=>classChoices.includes(c.id)):classes;
    if(!selectedRaces.length||!selectedClasses.length){Alert.alert("Sélection vide","Sélectionne au moins une race et une classe.");return;}
    const c=selectedClasses[Math.floor(Math.random()*selectedClasses.length)];
    const r=weighted(selectedRaces);
    const subs=r.subRaces||[];
    const selectedSubs=subRaceChoices[r.id]||[];
    const eligibleSubs=selectedSubs.length?subs.filter(s=>selectedSubs.includes(s.id)):subs;
    const sr=eligibleSubs.length?weighted(eligibleSubs):undefined;
    setCurrent(makeNPC(c,r,names,dice,nameChoice,sr));
  };
  const save=()=>{if(!current)return;setNpcs(x=>[current,...x.filter(n=>n.id!==current.id)]);Alert.alert("Sauvegardé","PNJ enregistré.");};
  const deleteNPC=(id:string)=>setNpcs(x=>x.filter(n=>n.id!==id));
  const reset=()=>Alert.alert("Réinitialiser ?","Les données personnalisées seront remplacées par les valeurs par défaut.",[
    {text:"Annuler",style:"cancel"},{text:"Réinitialiser",style:"destructive",onPress:()=>{setDice(DEFAULT_DICE);setRaces(DEFAULT_RACES);setClasses(DEFAULT_CLASSES);setNames(DEFAULT_NAMES);}}
  ]);

  const updateStat=(npc:NPC,s:string,v:string)=>{
    const num=Number(v); if(Number.isNaN(num))return;
    const stats={...npc.stats,[s]:num};const total=Object.values(stats).reduce((a,b)=>a+b,0); const level=(total-6)*3+1;
    setNpcs(xs=>xs.map(x=>x.id===npc.id?{...x,stats,total,level,palier:getPalier(level)}:x));
  };

  const DiceEditor=({cat}:{cat:Category})=>{
    const ds=dice[cat];
    const set=(g:Grade,field:keyof DiceRule,v:string)=>setDice(x=>({...x,[cat]:{...x[cat],[g]:{...x[cat][g],[field]:Number(v)}}}));
    return <View style={styles.card}><Text style={styles.h2}>{cat}</Text>
      {(["A","B","C"] as Grade[]).map(g=><View key={g}><Text style={styles.label}>Grade {g}</Text><View style={styles.row}>
        {(["dice","faces","modifier"] as (keyof DiceRule)[]).map(f=><TextInput key={f} style={styles.smallInput} keyboardType="numeric" value={String(ds[g][f])} onChangeText={v=>set(g,f,v)} placeholder={f}/>)}
      </View></View>)}
      <Text style={styles.label}>Minimum du total (relance complète)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={String(ds.minimum)} onChangeText={v=>setDice(x=>({...x,[cat]:{...x[cat],minimum:Number(v)}}))}/>
    </View>
  };

  return <SafeAreaView style={styles.root}><StatusBar style="light"/>
    <Text style={styles.title}>RAGNABEURK — PNJ</Text>
    <View style={styles.tabs}>{["Générer","PNJ sauvegardés","Données","Dés"].map(t=><Pressable key={t} onPress={()=>setTab(t)} style={[styles.tab,tab===t&&styles.active]}><Text style={styles.tabText}>{t}</Text></Pressable>)}</View>
    <ScrollView contentContainerStyle={styles.content}>
      {tab==="Générer"&&<View>
        <Text style={styles.h2}>Générateur</Text>
        <Text style={styles.label}>Races — aléatoire parmi la sélection</Text>
        <View style={styles.classButtons}>
          <Pressable onPress={selectAllRaces} style={[styles.classButton,raceChoices.length===races.length&&races.length>0&&styles.selected]}><Text style={styles.chipText}>🎲 Toutes</Text></Pressable>
          {races.map(r=><Pressable key={r.id} onPress={()=>toggleRace(r.id)} style={[styles.classButton,raceChoices.includes(r.id)&&styles.selected]}><Text style={styles.chipText}>{r.name}</Text></Pressable>)}
        </View>
        <Text style={styles.selectionHint}>{raceChoices.length?`${raceChoices.length} race(s) sélectionnée(s)`:"Aucune sélection = toutes les races"}</Text>
        {selectedRacesWithSubs(races,raceChoices).map(r=><View key={r.id} style={styles.subRaceBlock}>
          <Text style={styles.label}>Sous-races de {r.name}</Text>
          <View style={styles.classButtons}>
            <Pressable onPress={()=>selectAllSubRaces(r.id,r.subRaces||[])} style={[styles.classButton,(subRaceChoices[r.id]||[]).length===(r.subRaces||[]).length&&styles.selected]}><Text style={styles.chipText}>🎲 Toutes</Text></Pressable>
            {(r.subRaces||[]).map(sr=><Pressable key={sr.id} onPress={()=>toggleSubRace(r.id,sr.id)} style={[styles.classButton,(subRaceChoices[r.id]||[]).includes(sr.id)&&styles.selected]}><Text style={styles.chipText}>{sr.name}</Text></Pressable>)}
          </View>
          <Text style={styles.selectionHint}>{(subRaceChoices[r.id]||[]).length?`${(subRaceChoices[r.id]||[]).length} sous-race(s) sélectionnée(s)`:"Aucune sélection = toutes les sous-races"}</Text>
        </View>)}
        <Text style={styles.label}>Classes — aléatoire parmi la sélection</Text>
        <View style={styles.classRows}>
          {(["Base","Avancée","Super"] as Category[]).map(cat=>{const list=classes.filter(c=>c.category===cat);const allSelected=list.length>0&&list.every(c=>classChoices.includes(c.id));return <View key={cat} style={styles.classRow}>
            <Pressable onPress={()=>toggleClassCategory(cat)} style={[styles.categorySelectButton,allSelected&&styles.selected]}><Text style={styles.classRowLabel}>{cat}</Text><Text style={styles.chipText}>{allSelected?"Tout désélectionner":"Tout sélectionner"}</Text></Pressable>
            <View style={styles.classButtons}>{list.map(c=><Pressable key={c.id} onPress={()=>toggleClass(c.id)} style={[styles.classButton,classChoices.includes(c.id)&&styles.selected]}><Text style={styles.chipText}>{c.name}</Text></Pressable>)}</View>
          </View>})}
        </View>
        <Text style={styles.selectionHint}>{classChoices.length?`${classChoices.length} classe(s) sélectionnée(s)`:"Aucune sélection = toutes les classes"}</Text>
        <Text style={styles.label}>Nom (vide = aléatoire)</Text><TextInput style={styles.input} value={nameChoice} onChangeText={setNameChoice} placeholder="Nom manuel"/>
        <Pressable style={styles.bigButton} onPress={generate}><Text style={styles.bigButtonText}>GÉNÉRER UN PNJ</Text></Pressable>
        {current&&<View style={styles.card}><Text style={styles.npcName}>{current.name}</Text><Text style={styles.meta}>{current.race}{current.subRace?` • ${current.subRace}`:""} • {current.className} • {current.category}</Text><Text style={styles.level}>Niveau {current.level} • Palier {current.palier} • Total {current.total}</Text>
          {STATS.map(s=><View style={styles.statRow} key={s}><Text style={styles.statName}>{s}</Text><Text style={styles.grade}>{current.grades[s]}</Text><Text style={styles.statValue}>{current.stats[s]}</Text></View>)}
          <Pressable style={styles.button} onPress={save}><Text style={styles.buttonText}>Sauvegarder</Text></Pressable>
        </View>}
      </View>}

      {tab==="PNJ sauvegardés"&&<View><Text style={styles.h2}>{npcs.length} PNJ</Text>{npcs.map(n=><View style={styles.card} key={n.id}>
        <Text style={styles.npcName}>{n.name}</Text><Text style={styles.meta}>{n.race}{n.subRace?` • ${n.subRace}`:""} • {n.className} • Niveau {n.level} • Palier {n.palier}</Text>
        {STATS.map(s=><View style={styles.editRow} key={s}><Text style={styles.statName}>{s} ({n.grades[s]})</Text><TextInput style={styles.statInput} keyboardType="numeric" value={String(n.stats[s])} onChangeText={v=>updateStat(n,s,v)}/></View>)}
        <Pressable style={styles.danger} onPress={()=>deleteNPC(n.id)}><Text style={styles.buttonText}>Supprimer</Text></Pressable>
      </View>)}</View>}

      {tab==="Données"&&<View>
        <Text style={styles.h2}>Races</Text>
        {races.map(r=><View style={styles.card} key={r.id}>
          <Text style={styles.label}>Nom de la race</Text>
          <TextInput style={styles.input} value={r.name} onChangeText={v=>setRaces(xs=>xs.map(x=>x.id===r.id?{...x,name:v}:x))}/>
          <Text style={styles.label}>Poids</Text>
          <TextInput style={styles.input} value={String(r.weight)} keyboardType="numeric" onChangeText={v=>setRaces(xs=>xs.map(x=>x.id===r.id?{...x,weight:Number(v)}:x))}/>
          <Text style={styles.label}>Description</Text>
          <TextInput style={styles.input} value={r.description} onChangeText={v=>setRaces(xs=>xs.map(x=>x.id===r.id?{...x,description:v}:x))}/>
          <Text style={styles.h3}>Sous-races ({(r.subRaces||[]).length})</Text>
          {(r.subRaces||[]).map(sr=><View style={styles.subRaceEdit} key={sr.id}>
            <View style={styles.subRaceFields}>
              <TextInput style={styles.input} value={sr.name} onChangeText={v=>setRaces(xs=>xs.map(x=>x.id===r.id?{...x,subRaces:(x.subRaces||[]).map(y=>y.id===sr.id?{...y,name:v}:y)}:x))}/>
              <TextInput style={styles.input} value={sr.description||""} placeholder="Description (optionnelle)" placeholderTextColor="#777" onChangeText={v=>setRaces(xs=>xs.map(x=>x.id===r.id?{...x,subRaces:(x.subRaces||[]).map(y=>y.id===sr.id?{...y,description:v}:y)}:x))}/>
            </View>
            <TextInput style={styles.weightInput} value={String(sr.weight)} keyboardType="numeric" onChangeText={v=>setRaces(xs=>xs.map(x=>x.id===r.id?{...x,subRaces:(x.subRaces||[]).map(y=>y.id===sr.id?{...y,weight:Number(v)}:y)}:x))}/>
            <Pressable onPress={()=>setRaces(xs=>xs.map(x=>x.id===r.id?{...x,subRaces:(x.subRaces||[]).filter(y=>y.id!==sr.id)}:x))}><Text style={styles.removeText}>✕</Text></Pressable>
          </View>)}
          <Text style={styles.label}>Ajouter plusieurs sous-races (1 nom par ligne)</Text>
          <TextInput style={[styles.input,styles.multiline]} multiline value={bulkSubRaces[r.id]||""} placeholder="Semi-loup\nSemi-renard\nSemi-chat" placeholderTextColor="#777" onChangeText={v=>setBulkSubRaces(x=>({...x,[r.id]:v}))}/>
          <Pressable style={styles.button} onPress={()=>{const added=(bulkSubRaces[r.id]||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(name=>({id:Date.now().toString()+Math.random(),name,weight:100,description:""}));if(added.length){setRaces(xs=>xs.map(x=>x.id===r.id?{...x,subRaces:[...(x.subRaces||[]),...added]}:x));setBulkSubRaces(x=>({...x,[r.id]:""}));}}}><Text style={styles.buttonText}>+ Importer la liste</Text></Pressable>
          <Pressable style={styles.button} onPress={()=>setRaces(xs=>xs.map(x=>x.id===r.id?{...x,subRaces:[...(x.subRaces||[]),{id:Date.now().toString()+Math.random(),name:"Nouvelle sous-race",weight:100,description:""}]}:x))}><Text style={styles.buttonText}>+ Ajouter une sous-race</Text></Pressable>
          <Pressable style={styles.danger} onPress={()=>setRaces(xs=>xs.filter(x=>x.id!==r.id))}><Text style={styles.buttonText}>Supprimer</Text></Pressable>
        </View>)}
        <Pressable style={styles.button} onPress={()=>setRaces(x=>[...x,{id:Date.now().toString(),name:"Nouvelle race",weight:100,description:"",subRaces:[]}])}><Text style={styles.buttonText}>+ Ajouter une race</Text></Pressable>
        <Text style={styles.h2}>Classes</Text>
        {classes.map(c=><View style={styles.card} key={c.id}>
          <Text style={styles.label}>Nom de la classe</Text>
          <TextInput style={styles.input} value={c.name} onChangeText={v=>setClasses(xs=>xs.map(x=>x.id===c.id?{...x,name:v}:x))}/>
          <Text style={styles.label}>Catégorie</Text>
          <View style={styles.rowWrap}>{(["Base","Avancée","Super"] as Category[]).map(cat=><Pressable key={cat} onPress={()=>setClasses(xs=>xs.map(x=>x.id===c.id?{...x,category:cat}:x))} style={[styles.categoryButton,c.category===cat&&styles.selected]}><Text style={styles.chipText}>{cat}</Text></Pressable>)}</View>
          {STATS.map(s=><View style={styles.editRow} key={s}><Text style={styles.statName}>{s}</Text><View style={styles.row}>{(["A","B","C"] as Grade[]).map(g=><Pressable key={g} onPress={()=>setClasses(xs=>xs.map(x=>x.id===c.id?{...x,grades:{...x.grades,[s]:g}}:x))} style={[styles.gradeButton,c.grades[s]===g&&styles.selected]}><Text>{g}</Text></Pressable>)}</View></View>)}
          <Pressable style={styles.danger} onPress={()=>setClasses(xs=>xs.filter(x=>x.id!==c.id))}><Text style={styles.buttonText}>Supprimer</Text></Pressable>
        </View>)}
        <Pressable style={styles.button} onPress={()=>setClasses(x=>[...x,{id:Date.now().toString(),name:"Nouvelle classe",category:"Base",grades:Object.fromEntries(STATS.map(s=>[s,"C"])) as Record<string,Grade>}])}><Text style={styles.buttonText}>+ Ajouter une classe</Text></Pressable>
        <Text style={styles.h2}>Noms</Text><View style={styles.card}>{names.map((n,i)=><View style={styles.editRow} key={i}><TextInput style={styles.inputFlex} value={n} onChangeText={v=>setNames(xs=>xs.map((x,j)=>j===i?v:x))}/><Pressable onPress={()=>setNames(xs=>xs.filter((_,j)=>j!==i))}><Text>✕</Text></Pressable></View>)}<Pressable style={styles.button} onPress={()=>setNames(x=>[...x,"Nouveau nom"])}><Text style={styles.buttonText}>+ Ajouter un nom</Text></Pressable></View>
      </View>}

      {tab==="Dés"&&<View><Text style={styles.h2}>Paramètres des dés</Text><Text style={styles.help}>Nombre de dés • faces • modificateur. Le minimum provoque une relance complète des 6 caractéristiques.</Text>
        <DiceEditor cat="Base"/><DiceEditor cat="Avancée"/><DiceEditor cat="Super"/>
        <Pressable style={styles.button} onPress={()=>setDice(DEFAULT_DICE)}><Text style={styles.buttonText}>Réinitialiser les dés</Text></Pressable>
        <Pressable style={styles.danger} onPress={reset}><Text style={styles.buttonText}>Réinitialiser toutes les données</Text></Pressable>
      </View>}
    </ScrollView>
  </SafeAreaView>;
}

const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:"#101217"},content:{padding:14,paddingBottom:40},
  title:{color:"#fff",fontSize:22,fontWeight:"800",padding:16,textAlign:"center"},
  tabs:{flexDirection:"row",borderBottomWidth:1,borderColor:"#333"},tab:{flex:1,padding:10,alignItems:"center"},active:{backgroundColor:"#303641"},tabText:{color:"#fff",fontSize:11},
  h2:{color:"#fff",fontSize:20,fontWeight:"700",marginTop:12,marginBottom:12},h3:{color:"#e2bd63",fontSize:16,fontWeight:"700",marginTop:14,marginBottom:7},label:{color:"#bbb",marginTop:10,marginBottom:5},
  input:{backgroundColor:"#20242b",color:"#fff",padding:10,borderRadius:8,marginBottom:8},inputFlex:{flex:1,backgroundColor:"#20242b",color:"#fff",padding:8,borderRadius:8},
  smallInput:{backgroundColor:"#20242b",color:"#fff",padding:8,borderRadius:7,width:85,marginRight:6},row:{flexDirection:"row",alignItems:"center",gap:5},rowWrap:{flexDirection:"row",flexWrap:"wrap",gap:7},
  chip:{padding:9,backgroundColor:"#222832",borderRadius:16,marginRight:7},
  selectionHint:{fontSize:12,opacity:0.7,marginTop:4,marginBottom:8},categorySelectButton:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingVertical:7,paddingHorizontal:8,borderRadius:8,borderWidth:1,borderColor:"#999"},  classRows:{gap:10,marginBottom:8},classRow:{gap:5},classRowLabel:{color:"#bbb",fontWeight:"700"},classButtons:{flexDirection:"row",flexWrap:"wrap",gap:6},classButton:{padding:9,backgroundColor:"#222832",borderRadius:8},categoryButton:{padding:10,backgroundColor:"#222832",borderRadius:8},selected:{backgroundColor:"#b78b2c"},chipText:{color:"#fff"},
  bigButton:{backgroundColor:"#b78b2c",padding:16,borderRadius:10,marginVertical:14,alignItems:"center"},bigButtonText:{fontWeight:"900",color:"#111"},
  button:{backgroundColor:"#3d4654",padding:12,borderRadius:8,marginTop:10,alignItems:"center"},danger:{backgroundColor:"#74343b",padding:10,borderRadius:8,marginTop:10,alignItems:"center"},buttonText:{color:"#fff",fontWeight:"700"},
  card:{backgroundColor:"#191d24",padding:14,borderRadius:12,marginVertical:8},npcName:{color:"#fff",fontSize:19,fontWeight:"800"},meta:{color:"#aaa",marginVertical:4},level:{color:"#e2bd63",fontSize:18,fontWeight:"700",marginVertical:8},
  statRow:{flexDirection:"row",alignItems:"center",paddingVertical:7,borderBottomWidth:1,borderColor:"#292e37"},statName:{color:"#ddd",flex:1},grade:{color:"#e2bd63",fontWeight:"900",width:35},statValue:{color:"#fff",fontSize:18,fontWeight:"700",width:45,textAlign:"right"},
  subRaceBlock:{backgroundColor:"#151920",padding:10,borderRadius:9,marginBottom:8},subRaceEdit:{flexDirection:"row",alignItems:"center",gap:6,marginBottom:6},subRaceFields:{flex:1},weightInput:{backgroundColor:"#20242b",color:"#fff",padding:8,borderRadius:7,width:65,textAlign:"center"},removeText:{color:"#f08a8a",fontSize:18},multiline:{minHeight:90,textAlignVertical:"top"},editRow:{flexDirection:"row",alignItems:"center",paddingVertical:5},statInput:{backgroundColor:"#20242b",color:"#fff",padding:7,borderRadius:7,width:65,textAlign:"center"},gradeButton:{padding:7,borderRadius:5,backgroundColor:"#2a3039"},help:{color:"#aaa",lineHeight:20,marginBottom:8}
});
