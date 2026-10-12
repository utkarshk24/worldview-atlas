// Groupings (membership as of mid-2026), chokepoints, corridors
window.WV_GROUPS = {
QUAD:{n:{en:"Quad",hi:"क्वाड",mr:"क्वाड"},f:"Quadrilateral Security Dialogue",m:["IND","USA","JPN","AUS"]},
BRICS:{n:{en:"BRICS",hi:"ब्रिक्स",mr:"ब्रिक्स"},f:"BRICS (Saudi Arabia invited; participation unconfirmed)",m:["BRA","RUS","IND","CHN","ZAF","EGY","ETH","IRN","ARE","IDN"]},
SCO:{n:{en:"SCO",hi:"SCO",mr:"SCO"},f:"Shanghai Cooperation Organisation",m:["CHN","IND","KAZ","KGZ","RUS","TJK","UZB","PAK","IRN","BLR"]},
G20:{n:{en:"G20",hi:"G20",mr:"G20"},f:"Group of Twenty (plus the EU and African Union)",m:["ARG","AUS","BRA","CAN","CHN","FRA","DEU","IND","IDN","ITA","JPN","MEX","RUS","SAU","ZAF","KOR","TUR","GBR","USA"]},
I2U2:{n:{en:"I2U2",hi:"I2U2",mr:"I2U2"},f:"India–Israel–UAE–USA",m:["IND","ISR","ARE","USA"]},
IMEC:{n:{en:"IMEC",hi:"IMEC",mr:"IMEC"},f:"India–Middle East–Europe Economic Corridor MoU (2023, plus the EU)",m:["IND","USA","SAU","ARE","FRA","DEU","ITA"]},
BIMSTEC:{n:{en:"BIMSTEC",hi:"बिम्सटेक",mr:"बिमस्टेक"},f:"Bay of Bengal Initiative for Multi-Sectoral Technical and Economic Cooperation",m:["BGD","BTN","IND","MMR","NPL","LKA","THA"]},
SAARC:{n:{en:"SAARC",hi:"सार्क",mr:"सार्क"},f:"South Asian Association for Regional Cooperation",m:["AFG","BGD","BTN","IND","MDV","NPL","PAK","LKA"]},
IORA:{n:{en:"IORA",hi:"IORA",mr:"IORA"},f:"Indian Ocean Rim Association",m:["AUS","BGD","COM","FRA","IND","IDN","IRN","KEN","MDG","MYS","MDV","MUS","MOZ","OMN","SYC","SGP","SOM","ZAF","LKA","TZA","THA","ARE","YEM"]},
CSC:{n:{en:"Colombo Security Conclave",hi:"कोलंबो सुरक्षा सम्मेलन",mr:"कोलंबो सुरक्षा परिषद"},f:"Colombo Security Conclave",m:["IND","LKA","MDV","MUS","BGD"]},
ASEAN:{n:{en:"ASEAN",hi:"आसियान",mr:"आसियान"},f:"Association of Southeast Asian Nations (India: Comprehensive Strategic Partner)",m:["BRN","KHM","IDN","LAO","MYS","MMR","PHL","SGP","THA","VNM","TLS"],x:true},
G7:{n:{en:"G7",hi:"G7",mr:"G7"},f:"Group of Seven",m:["CAN","FRA","DEU","ITA","JPN","GBR","USA"],x:true},
EU:{n:{en:"EU",hi:"यूरोपीय संघ",mr:"युरोपियन युनियन"},f:"European Union",m:["AUT","BEL","BGR","HRV","CYP","CZE","DNK","EST","FIN","FRA","DEU","GRC","HUN","IRL","ITA","LVA","LTU","LUX","MLT","NLD","POL","PRT","ROU","SVK","SVN","ESP","SWE"],x:true},
NATO:{n:{en:"NATO",hi:"नाटो",mr:"नाटो"},f:"North Atlantic Treaty Organization",m:["ALB","BEL","BGR","CAN","HRV","CZE","DNK","EST","FIN","FRA","DEU","GRC","HUN","ISL","ITA","LVA","LTU","LUX","MNE","NLD","MKD","NOR","POL","PRT","ROU","SVK","SVN","ESP","SWE","TUR","GBR","USA"],x:true}
};
// x:true = India is not a member (shown for context only)

window.WV_CHOKE = [
{id:"hormuz",ll:[56.45,26.55],n:{en:"Strait of Hormuz",hi:"होर्मुज़ जलडमरूमध्य",mr:"होर्मुझ सामुद्रधुनी"},t:"Gateway for Gulf crude oil and LNG. A large share of India's energy imports passes through it."},
{id:"bab",ll:[43.35,12.6],n:{en:"Bab el-Mandeb",hi:"बाब-अल-मंदेब",mr:"बाब-अल-मंदेब"},t:"Links the Red Sea to the Gulf of Aden. India–Europe trade via Suez depends on it; the Indian Navy has run anti-piracy patrols in the Gulf of Aden since 2008."},
{id:"suez",ll:[32.35,30.45],n:{en:"Suez Canal",hi:"स्वेज़ नहर",mr:"सुएझ कालवा"},t:"Shortest sea route between India and Europe."},
{id:"malacca",ll:[101.2,2.7],n:{en:"Strait of Malacca",hi:"मलक्का जलडमरूमध्य",mr:"मलाक्का सामुद्रधुनी"},t:"Main link between the Indian Ocean and the Pacific. India's Andaman and Nicobar Islands sit near its western approach."},
{id:"six",ll:[94.0,6.3],n:{en:"Six Degree Channel",hi:"छह डिग्री चैनल",mr:"सहा अंश चॅनेल"},t:"Between Great Nicobar (India) and Sumatra; the western entry to Malacca."},
{id:"ten",ll:[92.6,10.0],n:{en:"Ten Degree Channel",hi:"दस डिग्री चैनल",mr:"दहा अंश चॅनेल"},t:"Separates the Andaman Islands from the Nicobar Islands."},
{id:"nine",ll:[73.3,9.0],n:{en:"Nine Degree Channel",hi:"नौ डिग्री चैनल",mr:"नऊ अंश चॅनेल"},t:"Separates Minicoy from the main Lakshadweep islands; carries heavy east–west shipping."},
{id:"sunda",ll:[105.8,-5.95],n:{en:"Sunda Strait",hi:"सुंडा जलडमरूमध्य",mr:"सुंडा सामुद्रधुनी"},t:"Alternative to Malacca, between Sumatra and Java."},
{id:"lombok",ll:[115.75,-8.55],n:{en:"Lombok Strait",hi:"लोम्बोक जलडमरूमध्य",mr:"लोम्बोक सामुद्रधुनी"},t:"Deep-water route used by very large tankers that cannot transit Malacca."},
{id:"taiwan",ll:[119.6,24.3],n:{en:"Taiwan Strait",hi:"ताइवान जलडमरूमध्य",mr:"तैवान सामुद्रधुनी"},t:"Busy route for India's trade with Northeast Asia."},
{id:"mozambique",ll:[41.0,-17.0],n:{en:"Mozambique Channel",hi:"मोज़ाम्बिक चैनल",mr:"मोझांबिक चॅनेल"},t:"East African route used when traffic diverts around the Cape."},
{id:"cape",ll:[18.47,-34.36],n:{en:"Cape of Good Hope",hi:"केप ऑफ़ गुड होप",mr:"केप ऑफ गुड होप"},t:"Alternative to Suez; diversions surged during attacks on Red Sea shipping from late 2023."},
{id:"gibraltar",ll:[-5.6,35.95],n:{en:"Strait of Gibraltar",hi:"जिब्राल्टर जलडमरूमध्य",mr:"जिब्राल्टरची सामुद्रधुनी"},t:"Atlantic–Mediterranean gateway."},
{id:"bosporus",ll:[29.05,41.12],n:{en:"Bosporus",hi:"बोस्पोरस",mr:"बॉस्पोरस"},t:"Black Sea access; matters for grain, fertiliser and oil flows."},
{id:"panama",ll:[-79.7,9.1],n:{en:"Panama Canal",hi:"पनामा नहर",mr:"पनामा कालवा"},t:"Atlantic–Pacific link for trade with the Americas."}
];

window.WV_CORR = {
imec:{n:{en:"IMEC — India–Middle East–Europe Economic Corridor",hi:"IMEC — भारत–मध्य पूर्व–यूरोप आर्थिक गलियारा",mr:"IMEC — भारत–मध्यपूर्व–युरोप आर्थिक कॉरिडॉर"},t:"Announced at the G20 New Delhi summit (September 2023): sea link from western India to the UAE, rail across Saudi Arabia and Jordan to Haifa, then sea to Europe. Route shown is indicative.",
 legs:[{k:"sea",c:[[69.7,22.74],[56.36,25.12]]},{k:"rail",c:[[56.36,25.12],[51.6,24.1],[46.7,24.7],[37.15,31.45],[34.99,32.82]]},{k:"sea",c:[[34.99,32.82],[23.6,37.94]]},{k:"sea",c:[[23.6,37.94],[15.6,38.2],[5.37,43.3]]}]},
instc:{n:{en:"INSTC — International North–South Transport Corridor",hi:"INSTC — अंतरराष्ट्रीय उत्तर–दक्षिण परिवहन गलियारा",mr:"INSTC — आंतरराष्ट्रीय उत्तर–दक्षिण वाहतूक कॉरिडॉर"},t:"Multimodal route linking Mumbai to Russia via Iran and the Caspian region (agreement 2000). India also operates a terminal at Chabahar port under a 10-year agreement signed in 2024. Route shown is indicative.",
 legs:[{k:"sea",c:[[72.88,18.95],[56.27,27.18]]},{k:"rail",c:[[56.27,27.18],[51.39,35.69],[49.58,37.28],[49.87,40.41],[48.03,46.35],[37.62,55.75]]}],
 pts:[{n:"Chabahar",ll:[60.62,25.29]}]},
lanes:{n:{en:"Indian Ocean sea lanes",hi:"हिंद महासागर समुद्री मार्ग",mr:"हिंद महासागरातील सागरी मार्ग"},t:"Principal east–west shipping lanes across the Indian Ocean, the Gulf energy route, and the Cape alternative. Indicative.",
 legs:[{k:"lane",c:[[32.55,29.9],[38,20],[43.4,12.6],[50,12.5],[60,13],[73,9],[80.5,5.6],[90,6],[94.5,6.2],[98,5.5],[101.3,2.6],[104,1.3],[110,8],[114,16],[119.5,24],[123,31]]},{k:"lane",c:[[56.3,26.5],[59,23.5],[66,20],[72.8,18.9]]},{k:"lane",c:[[18.47,-34.6],[32,-30],[41.5,-17],[50,-5],[62,5],[73,9]]}]}
};
