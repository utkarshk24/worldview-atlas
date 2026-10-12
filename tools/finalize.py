import json, sys, os, re, collections
S=sys.argv[1]; N=S+'/data/node_modules'
C=json.load(open('countries.json'))
# Kosovo population alias
import csv
pop=collections.defaultdict(dict)
for r in csv.DictReader(open(S+'/data/population/data/population.csv')): pop[r['Country Code']][int(r['Year'])]=float(r['Value'])
gdp=collections.defaultdict(dict)
for r in csv.DictReader(open(S+'/data/gdp/data/gdp.csv')):
    try: gdp[r['Country Code']][int(r['Year'])]=float(r['Value'])
    except: pass
k='UNK'; p=pop['XKX']; g=gdp['XKX']
if p:
    py=max(p); C[k]['pop']=[int(p[py]),py]; C[k]['pt']=[[y,int(p[y])] for y in sorted(p) if y%5==0 and y>=1990]+[[py,int(p[py])]]
if g:
    gy=max(g); C[k]['gdp']=[round(g[gy]/1e9,2),gy]; C[k]['gt']=[[y,round(g[y]/1e9,2)] for y in sorted(g) if y>=2000]
    if gy in p: C[k]['pc']=[round(g[gy]/p[gy]),gy]
# dedupe trend last point
for v in C.values():
    seen=set(); v['pt']=[x for x in v['pt'] if not (x[0] in seen or seen.add(x[0]))]
# timezones
tzd=json.load(open(N+'/countries-and-timezones/dist/index.json')) if os.path.exists(N+'/countries-and-timezones/dist/index.json') else None

# ---- extra metrics: HDI (UNDP HDR 2025, 2023 values), Gini + newer GDP + capital coords (Factbook)
FBX=json.load(open('factbook.json'))
HDI=json.load(open('research/hdi.json'))
def money(t):
    m=re.match(r"\$([\d.,]+)\s*(trillion|billion|million)?\s*\((\d{4})",t or "")
    if not m: return None
    v=float(m.group(1).replace(',',''));mul={'trillion':1000,'billion':1,'million':.001}.get(m.group(2),1e-9)
    return round(v*mul,2),int(m.group(3))
def ll(t):
    m=re.match(r"\s*(\d+)\s+(\d+)\s*([NS]),\s*(\d+)\s+(\d+)\s*([EW])",t or "")
    if not m: return None
    la=(int(m.group(1))+int(m.group(2))/60)*(1 if m.group(3)=='N' else -1); lo=(int(m.group(4))+int(m.group(5))/60)*(1 if m.group(6)=='E' else -1)
    return [round(la,3),round(lo,3)]
for k,v in C.items():
    if k in HDI: v['hdi']=[HDI[k][0],HDI[k][1],2023]
    m=(FBX.get(k) or {}).get('_m') or {}
    g=re.search(r'"text": "([\d.]+) \((\d{4})',m.get('gini') or '')
    if g: v['gini']=[float(g.group(1)),int(g.group(2))]
    gm=money(m.get('gdpoff'))
    if gm and (not v.get('gdp') or gm[1]>v['gdp'][1]):
        v['gdp']=[gm[0],gm[1],'fb']
        pp=pop.get('XKX' if k=='UNK' else k,{})
        if gm[1] in pp: v['pc']=[round(gm[0]*1e9/pp[gm[1]]),gm[1],'fb']
    c=ll(m.get('capll'))
    if c: v['capll']=c
for r in FBX.values(): r.pop('_m',None)
tz=json.load(open('tz.json'))
for v in C.values(): v['tz']=tz.get(v['a2'],[])
json.dump(C,open('out/countries.json','w'),ensure_ascii=False,separators=(',',':'))
# geo
def geo(src,dst):
    t=json.load(open(src)); o=list(t['objects'].values())[0]
    remap={'KOS':'UNK','SDS':'SSD','SAH':'ESH','PSX':'PSE','ALD':'ALA'}
    for g in o['geometries']:
        pr=g['properties']; iso=pr['ISO_A3']; a=pr['ADM0_A3']
        code=iso if iso not in ('-99',None) else remap.get(a,a)
        if code not in C and a in C: code=a
        g['id']=code; g['properties']={'n':pr['NAME']}
    t['objects']={'c':o}
    json.dump(t,open(dst,'w'),separators=(',',':'))
    return [g['id'] for g in o['geometries'] if g['id'] not in C]
print('geo default extras',geo(S+'/ne/out_ne_10m_admin_0_countries.topojson','out/geo-global.json'))
print('geo ind extras',geo(S+'/ne/out_ne_10m_admin_0_countries_ind.topojson','out/geo-india.json'))
# shards: factbook + flag svg
FB=FBX
fl=N+'/flag-icons/flags/4x3/'
shards=collections.defaultdict(dict)
for k,v in C.items():
    rec={'fb':FB.get(k)}
    f=fl+v['a2'].lower()+'.svg'
    if os.path.exists(f):
        s=open(f).read(); s=re.sub(r'\s+',' ',s); rec['flag']=s
    shards[k[0]][k]=rec
for L,d in shards.items(): json.dump(d,open(f'out/shard/{L}.json','w'),ensure_ascii=False,separators=(',',':'))
print('shards',len(shards), sum(os.path.getsize('out/shard/'+f) for f in os.listdir('out/shard'))//1024,'KB')
