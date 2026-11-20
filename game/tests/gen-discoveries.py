# data/discoveries.json üreticisi (kaynak: bu liste). python3 -I out/gen-discoveries.py
import json, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = []
def d(i, cat, tier, title, desc, hint, need, secret=False):
    e = {"id": i, "cat": cat, "tier": tier, "title": title, "desc": desc, "hint": hint, "need": need}
    if secret: e["secret"] = True
    D.append(e)
def O(kind, mn=1, level=1): return {"observed": {"kind": kind, "min": mn, "level": level}}
# ---- Evren
d("ev-ilk-isik","Evren",1,"İlk Işık","Evreninin ilk galaksisine baktın. Karanlık artık bir harita.","Evren haritasında bir galaksiye dokun.",O("g"))
d("ev-uc-galaksi","Evren",1,"Üçlü Bakış","Üç farklı galaksiyi gözlemledin; her birinin karakteri ayrı.","Üç galaksiye sırayla dokun.",O("g",3))
d("ev-sessiz-an","Evren",1,"Sessiz An","Zamanı durdurdun. Bazen en iyi gözlem, hiçbir şeyin kıpırdamadığı andır.","Hız kontrolünden duraklat.",{"speed":{"ix":0}})
d("ev-zaman-akisi","Evren",1,"Zamanın Akışı","Zamanı hızlandırdın; milyonlarca yıl saniyelere sığıyor.","Hız kontrolünü 10× veya daha yükseğe çıkar.",{"speed":{"ix":2}})
d("ev-dort-olcek","Evren",2,"Dört Ölçek","Evrenden bir gezegene kadar tüm ölçekleri gezdin.","Evrenden bir gezegene kadar yakınlaş.",{"scales":{"min":4}})
d("ev-milyar-yil","Evren",2,"Bir Milyar Yıl","Evrenin saati bir milyar yılı geçti.","Zamanı hızlandır ve bekle; kozmik zaman bir milyar yıla ulaşsın.",{"t":{"min":1000}})
d("ev-bin-kat","Evren",2,"Bin Kat Hız","En hızlı zaman akışını denedin.","Hız kontrolünün en sonuncusunu seç.",{"speed":{"ix":4}})
d("ev-portre","Evren",2,"Evrenin Portresi","Gördüğün manzaranın bir fotoğrafını çektin.","Fotoğraf modunu kullan.",{"flag":"photo"})
d("ev-derin-zaman","Evren",3,"Derin Zaman","On milyar yıl: yıldızların doğup öldüğü bir ölçek.","Evrenin yaşını on milyar yıla taşı.",{"t":{"min":10000}})
d("ev-atlas","Evren",3,"Tüm Harita","Yedi galaksiyi de gözlemledin; evrenin ana haritası tamam.","Haritadaki tüm galaksilere bak.",O("g",7))
# ---- Galaksi
d("ga-gezgin","Galaksi",1,"Galaksi Gezgini","İlk kez bir galaksinin içine girdin.","Bir galaksiye yakınlaş.",{"scale":"galaxy"})
d("ga-sarmal","Galaksi",1,"Sarmal Kollar","Kollu, dönen bir sarmal galaksi gördün.","Kolları olan, dönen bir galaksi ara.",{"gkind":{"kind":"spiral"}})
d("ga-cubuk","Galaksi",2,"Çubuğun Gizi","Merkezinde yıldız çubuğu olan bir galaksiyi buldun.","Merkezi uzun bir çubuk gibi görünen galaksiyi bul.",{"gkind":{"kind":"barred"}})
d("ga-eliptik","Galaksi",2,"Yaşlı Dev","Yumuşak, kolsuz, yaşlı bir eliptik galaksi gözlemledin.","Yuvarlak ve kolsuz bir galaksi bul.",{"gkind":{"kind":"elliptical"}})
d("ga-duzensiz","Galaksi",2,"Düzensiz Güzellik","Biçimi belli olmayan bir galaksiyi inceledin.","Biçimsiz görünen bir galaksiye bak.",{"gkind":{"kind":"irregular"}})
d("ga-yakin-bak","Galaksi",2,"Yakından Bak","Aynı galaksiyi tekrar tekrar gözlemleyerek daha çok şey öğrendin.","Aynı galaksiyi bir kez daha gözlemle.",O("g",1,2))
d("ga-dort-bicim","Galaksi",3,"Dört Biçim","Sarmal, çubuklu, eliptik ve düzensiz: dört galaksi türünü de gördün.","Her türden bir galaksi gözlemle.",{"all":[{"gkind":{"kind":"spiral"}},{"gkind":{"kind":"barred"}},{"gkind":{"kind":"elliptical"}},{"gkind":{"kind":"irregular"}}]})
d("ga-anatomi","Galaksi",3,"Galaksi Anatomisi","Bir galaksinin en derin bilgi katmanına ulaştın.","Bir galaksiyi üç kez gözlemle.",O("g",1,3))
d("ga-yayilim","Galaksi",3,"Üç Galaksi, Üç Hikâye","Üç ayrı galaksiden yıldızlar gözlemledin.","Farklı galaksilere girip her birinden bir yıldıza bak.",{"spread":{"min":3}})
d("ga-evrensel","Galaksi",4,"Evrensel Atlas","Beş galaksiyi ikinci bilgi katmanına kadar tanıyorsun.","Birçok galaksiyi tekrar gözlemle.",O("g",5,2))
# ---- Yıldız
d("ye-ilk","Yıldız",1,"İlk Yıldız","Bir yıldız sistemine yaklaşıp yıldızını tanıdın.","Bir galaksiye gir ve bir yıldıza dokun.",O("s"))
d("ye-sari","Yıldız",1,"Sarı Cüce","Güneş'e benzeyen sarı bir yıldız buldun.","Sarı, orta büyüklükte bir yıldız ara.",{"scls":{"cls":"G"}})
d("ye-kirmizi","Yıldız",1,"Soğuk Işık","Sönük, uzun ömürlü bir kırmızı cüceye baktın.","Kırmızı ve sönük bir yıldız bul.",{"scls":{"cls":"M"}})
d("ye-on","Yıldız",2,"On Yıldızlı Gece","On farklı yıldızı gözlemledin.","Galaksilerde gezip yıldızlara bak.",O("s",10))
d("ye-turuncu","Yıldız",2,"Turuncu Huzur","Sakin, turuncu bir K tipi yıldız inceledin.","Turuncu bir yıldız bul.",{"scls":{"cls":"K"}})
d("ye-mavi","Yıldız",2,"Mavi Dev","Kısa ömürlü, çok parlak, sıcak bir yıldız gördün.","Mavi-beyaz, çok parlak bir yıldız ara.",{"any":[{"scls":{"cls":"O"}},{"scls":{"cls":"B"}}]})
d("ye-protoyildiz","Yıldız",3,"Doğum Odası","Henüz doğmakta olan bir protoyıldıza tanık oldun.","Genç, gaz bulutuna sarılı bir yıldız bul.",{"sphase":{"phase":"protostar"}})
d("ye-dev","Yıldız",3,"Şişen Dev","Hidrojeni biten bir yıldızın dev evresini gördün.","Yaşlanmış, şişmiş kırmızı bir yıldız ara.",{"sphase":{"phase":"giant"}})
d("ye-beyaz-cuce","Yıldız",3,"Beyaz Cüce","Bir yıldızın küçük, sıcak ve sönen küllerini buldun.","Ömrünü tamamlamış küçük bir yıldız ara.",{"sphase":{"phase":"dwarf"}})
d("ye-tayf","Yıldız",4,"Tayf Koleksiyonu","O'dan M'ye yıldız sınıflarının hepsini gözlemledin.","Her renkten ve sınıftan yıldız topla.",{"all":[{"scls":{"cls":"O"}},{"scls":{"cls":"B"}},{"scls":{"cls":"A"}},{"scls":{"cls":"F"}},{"scls":{"cls":"G"}},{"scls":{"cls":"K"}},{"scls":{"cls":"M"}}]})
d("ye-notron","Yıldız",4,"Atan Kalp","Saniyede dönen, çekirdek kadar yoğun bir nötron yıldızı buldun.","Çok eski ve çok yoğun bir yıldız kalıntısı ara.",{"sphase":{"phase":"neutron"}},True)
d("ye-karadelik","Yıldız",4,"Olay Ufku","Işığın bile kaçamadığı bir kara delik gördün.","Işık yaymayan, çevresini büken bir nokta ara.",{"sphase":{"phase":"blackhole"}},True)
# ---- Gezegen
d("pl-ilk","Gezegen",1,"İlk Dünya","Bir yıldız sisteminde ilk gezegenini gözlemledin.","Bir yıldız sistemine gir ve bir gezegene dokun.",O("p"))
d("pl-uc","Gezegen",1,"Üç Dünya","Üç gezegen tanıdın.","Birkaç gezegeni gözlemle.",O("p",3))
d("pl-gaz","Gezegen",1,"Gaz Devi","Katı yüzeyi olmayan dev bir gaz gezegen buldun.","Büyük ve bantlı bir gezegene bak.",{"ptype":{"type":"gas"}})
d("pl-okyanus","Gezegen",2,"Mavi Dünya","Yüzeyi okyanusla kaplı bir gezegen buldun.","Mavi, su dolu bir dünya ara.",{"ptype":{"type":"ocean"}})
d("pl-halka","Gezegen",2,"Halkalı Güzellik","Halkaları olan bir gezegen gözlemledin.","Çevresinde halka olan bir gezegen bul.",{"ptype":{"type":"ringed"}})
d("pl-lav","Gezegen",2,"Erimiş Yüzey","Yüzeyi lav olan, yıldızına çok yakın bir dünya gördün.","Yıldızına çok yakın, kızgın bir gezegen ara.",{"ptype":{"type":"lava"}})
d("pl-col","Gezegen",2,"Kızıl Çöl","Kurak, kumlu bir çöl gezegenine indin.","Kuru ve kızıl bir gezegen bul.",{"ptype":{"type":"desert"}})
d("pl-buz","Gezegen",2,"Donmuş Sessizlik","Buzla kaplı soğuk bir dünya inceledin.","Yıldızından uzak, buz tutmuş bir gezegen ara.",{"ptype":{"type":"ice"}})
d("pl-kusak","Gezegen",2,"Yaşam Kuşağında","Yıldızına ne çok yakın ne çok uzak bir gezegen buldun: sıvı su için doğru mesafe.","Yaşanabilir kuşaktaki bir gezegeni gözlemle.",{"habZone":True})
d("pl-uydu","Gezegen",2,"Uydu Sahibi","En az bir uydusu olan bir gezegen gözlemledin.","Etrafında küçük bir cisim dönen gezegen bul.",{"moons":{"min":1}})
d("pl-iliman","Gezegen",2,"İlıman Dünya","Sıcaklığı sıvı suya uygun aralıkta bir gezegen buldun.","Çok sıcak ve çok soğuk olmayan bir gezegen ara.",{"temp":{"min":273,"max":310}})
d("pl-uydu-ailesi","Gezegen",3,"Uydu Ailesi","Üç ya da daha fazla uydusu olan bir gezegen gördün.","Çok uydulu bir gezegen ara.",{"moons":{"min":3}})
d("pl-atlas","Gezegen",3,"Gezegen Atlası","On gezegen gözlemledin.","Sistemlerde gezip gezegenleri gözlemle.",O("p",10))
d("pl-tur-koleksiyonu","Gezegen",4,"Tür Koleksiyonu","Altı gezegen türünün hepsini gördün.","Her türden gezegen topla.",{"all":[{"ptype":{"type":"rocky"}},{"ptype":{"type":"ocean"}},{"ptype":{"type":"ice"}},{"ptype":{"type":"gas"}},{"ptype":{"type":"lava"}},{"ptype":{"type":"desert"}}]})
# ---- Olay
d("ol-ilk-haber","Olay",1,"İlk Haber","Evren sana ilk kozmik olayını gösterdi.","Zamanı hızlandır ve bekle; evren konuşur.",{"events":{"min":1}})
d("ol-kuyruklu","Olay",2,"Gökte Bir Kuyruk","Bir kuyruklu yıldızın geçişine tanık oldun.","Zamanı hızlandırıp kuyruklu yıldız olayını bekle.",{"event":"comet"})
d("ol-bulutsu","Olay",2,"Gazdan Işığa","Bir bulutsunun belirişini gördün.","Uzun süre hızlandırılmış zaman akışını izle.",{"event":"nebula"})
d("ol-dogum","Olay",2,"Yıldız Doğumu","Bir yıldız gözünün önünde doğdu.","Zamanı hızlandır; yeni yıldızlar doğabilir.",{"event":"stellar-birth"})
d("ol-olum","Olay",2,"Yıldızın Ölümü","Bir yıldız ömrünü tamamladı.","Çok uzun zaman akışı bekle; yıldızlar ölür.",{"event":"star-dies"})
d("ol-nova","Olay",2,"Ani Parlama","Bir nova patlaması gördün.","Bol zaman akışı; bir yıldız aniden parlayabilir.",{"event":"nova"})
d("ol-on","Olay",2,"On Haber","On kozmik olay kaydettin.","Zamanı hızlandır ve olayları topla.",{"events":{"min":10}})
d("ol-supernova","Olay",3,"Süpernova","Bir yıldızın dev patlamasına tanık oldun.","Çok büyük bir yıldızın sonunu bekle.",{"event":"supernova"})
d("ol-kusak-kaymasi","Olay",3,"Kuşak Kayması","Bir yıldızın yaşam kuşağı kaydı; bir gezegen yaşanabilirlik sınırını geçti.","Yıldızlar yaşlandıkça kuşak yer değiştirir; bekle.",{"event":"habitable-shift"})
d("ol-carpisma","Olay",3,"Kozmik Çarpışma","İki cismin çarpışmasına tanık oldun.","Uzun süre bekle; nadir bir çarpışma olabilir.",{"event":"collision"})
d("ol-cesit","Olay",3,"Çeşitli Gökyüzü","Beş farklı türde kozmik olay gördün.","Farklı olaylar için zamanı akıtmaya devam et.",{"eventKinds":{"min":5}})
d("ol-tarihci","Olay",4,"Kozmik Tarihçi","Yirmi beş olay: evreninin tarihi artık yazılı.","Günlüğü dolduracak kadar zaman geçir.",{"events":{"min":25}})
# ---- Karar
d("ka-ilk","Karar",1,"İlk Müdahale","Bir gezegene ilk kararını uyguladın ve sonucunu gördün.","Gözlemlediğin bir gezegene dokun ve bir karar seç.",{"decisions":{"min":1}})
d("ka-sera","Karar",1,"Sera Ustası","Atmosferi kalınlaştırıp ısının nasıl tutulduğunu gördün.","Bir gezegende atmosferi artır.",{"decided":"sera-artir"})
d("ka-su","Karar",1,"Su Taşıyıcı","Bir gezegene su ekledin.","Bir gezegende su miktarını artır.",{"decided":"su-ekle"})
d("ka-bulut","Karar",1,"Bulut Ressamı","Yansıtıcılığı artırarak gezegeni serinlettin.","Yüzeyin ışığı yansıtmasını artır.",{"decided":"bulut-artir"})
d("ka-geri","Karar",2,"Pişmanlık Yok","Verdiğin bir kararı geri aldın; evren esnektir.","Uyguladığın bir kararın tersini seç.",{"reverted":{"min":1}})
d("ka-dogal","Karar",2,"Doğaya Saygı","Bir gezegeni doğal haline döndürdün.","Bir gezegende 'doğal duruma dön' kararını seç.",{"decided":"gezegen-dogal"})
d("ka-denge","Karar",3,"Denge Sanatı","Beş farklı türde karar denedin.","Farklı karar türlerini dene.",{"decidedKinds":{"min":5}})
d("ka-cennet","Karar",3,"Cennet Mühendisi","Yaşanabilir olmayan bir gezegeni, yaşanabilir aralığa getirdin.","Çok sıcak ya da soğuk bir gezegeni dengeye getir.",{"flag":"made-habitable"})
d("ka-kuyruklu","Karar",3,"Kuyruklu Yıldız Postacısı","Bir kuyruklu yıldızı gezegene yönlendirip su ve gaz taşıttın.","Bir gezegeni derin gözlemle, sonra kuyruklu yıldız yönlendir.",{"decided":"kuyruklu-yonlendir"})
d("ka-bolge","Karar",3,"Bölgesel Karar","Bir galaksideki tüm gözlemlediğin gezegenlere birlikte karar uyguladın.","Bir galaksiyi gözlemle ve bölgesel bir karar seç.",{"any":[{"decided":"bolge-sera-artir"},{"decided":"bolge-su-artir"}]})
d("ka-ders","Karar",3,"Gerçek Bir Ders","Bir müdahale yaşanabilir bir dünyayı bozdu. Bilim de böyle öğrenir.","Dikkatli ol: her karar iki yöne gidebilir.",{"flag":"lost-habitable"},True)
d("ka-yirmi","Karar",4,"Yirmi Karar","Yirmi karar uyguladın; neden-sonuç ilişkilerini iyi biliyorsun.","Gezegenlerle oynamaya devam et.",{"decisions":{"min":20}})
ids=[x["id"] for x in D]; assert len(ids)==len(set(ids))
# ---- Kararlar (action)
def a(i, target, label, desc, why, tag, delta, inv=None, level=1, base=False):
    e = {"id":i,"target":target,"label":label,"desc":desc,"why":why,"tag":tag,"delta":delta,"level":level}
    if inv: e["reverse"]=inv
    if base: e["restore"]=True
    return e
A = [
 a("sera-artir","p","Atmosferi kalınlaştır","Atmosfer yoğunluğunu +0,25 artırır.","Daha kalın atmosfer sera etkisini güçlendirir: ısı uzaya zor kaçar, sıcaklık yükselir.","basit",{"atm":0.25},"sera-azalt"),
 a("sera-azalt","p","Atmosferi incelt","Atmosfer yoğunluğunu −0,25 azaltır.","İnce atmosfer ısıyı tutamaz: gece-gündüz farkı büyür, ortalama sıcaklık düşer.","basit",{"atm":-0.25},"sera-artir"),
 a("su-ekle","p","Su ekle","Su miktarını +0,25 artırır.","Daha çok su, bulut ve buhar demektir: ısıyı biraz tutar, yüzeyi serinletici bulutlar da oluşur.","basit",{"water":0.25},"su-cek"),
 a("su-cek","p","Su azalt","Su miktarını −0,25 azaltır.","Su azalınca bulut ve buhar azalır; yüzey kurur, iklim daha uç değerlere gider.","basit",{"water":-0.25},"su-ekle"),
 a("bulut-artir","p","Yansıtıcılığı artır","Yansıtıcılığı (albedo) +0,10 artırır.","Parlak yüzey ve bulutlar ışığın daha çoğunu geri yansıtır; gezegen daha az ısınır.","gercek",{"albedo":0.10},"toz-artir"),
 a("toz-artir","p","Yüzeyi karart","Yansıtıcılığı (albedo) −0,10 azaltır.","Koyu yüzey ışığı soğurur; gezegen daha çok ısınır.","gercek",{"albedo":-0.10},"bulut-artir"),
 a("kuyruklu-yonlendir","p","Kuyruklu yıldız yönlendir","Su +0,30, atmosfer +0,10. Derin gözlem (seviye 2) gerekir.","Buzlu kuyruklu yıldızlar su ve gaz taşır; çarpınca gezegene bırakırlar. (Yönlendirme kurgudur; su taşıma fikri gerçektir.)","kurgu",{"water":0.30,"atm":0.10},"atmosfer-kacisi",2),
 a("atmosfer-kacisi","p","Atmosfer kaçışını hızlandır","Su −0,30, atmosfer −0,10. Derin gözlem (seviye 2) gerekir.","Zayıf manyetik alan ya da yıldız rüzgârı atmosferi aşındırır; hafif gazlar ve su kaybolur. (Kurgusal müdahale.)","kurgu",{"water":-0.30,"atm":-0.10},"kuyruklu-yonlendir",2),
 a("gezegen-dogal","p","Doğal duruma dön","Atmosfer, su ve yansıtıcılığı ilk haline getirir.","Müdahale öncesi değerlere dönülür; iklim yeniden doğal dengesine oturur.","basit",{},None,1,True),
 a("bolge-sera-artir","g","Bölgesel sera artışı","Galaksideki gözlemlenmiş tüm gezegenlerde atmosfer +0,10.","Aynı küçük değişiklik birçok gezegende farklı sonuç verir: yıldıza uzaklık ve albedo belirleyicidir.","basit",{"atm":0.10},"bolge-sera-azalt",2),
 a("bolge-sera-azalt","g","Bölgesel sera azalışı","Galaksideki gözlemlenmiş tüm gezegenlerde atmosfer −0,10.","Atmosfer inceldikçe sıcak gezegenler serinler, soğuk olanlar daha da soğur.","basit",{"atm":-0.10},"bolge-sera-artir",2),
 a("bolge-su-artir","g","Bölgesel su artışı","Galaksideki gözlemlenmiş tüm gezegenlerde su +0,10.","Su miktarı iklimin hem ısıtıcı hem serinletici etkisini değiştirir; sonuç gezegenden gezegene farklıdır.","basit",{"water":0.10},"bolge-su-azalt",2),
 a("bolge-su-azalt","g","Bölgesel su azalışı","Galaksideki gözlemlenmiş tüm gezegenlerde su −0,10.","Su azalınca bulutlar ve buhar azalır; yüzeyler kuraklaşır.","basit",{"water":-0.10},"bolge-su-artir",2),
 a("galaksi-dogal","g","Galaksiyi doğal haline döndür","Galaksideki müdahale edilmiş tüm gezegenleri ilk haline getirir.","Tüm kararlar geri alınır; her gezegen doğal iklimine döner.","basit",{},None,2,True),
]
BADGES = [
 {"id":"cirak","title":"Çırak Gözlemci","desc":"3 keşif","need":{"total":{"min":3}}},
 {"id":"gokyuzu","title":"Gökyüzü Okuyucusu","desc":"10 keşif","need":{"total":{"min":10}}},
 {"id":"zaman","title":"Zaman Yolcusu","desc":"Evren kategorisinde 6 keşif","need":{"count":{"cat":"Evren","min":6}}},
 {"id":"kartograf","title":"Kartograf","desc":"Galaksi kategorisinde 6 keşif","need":{"count":{"cat":"Galaksi","min":6}}},
 {"id":"yildiz","title":"Yıldız Okuyucu","desc":"Yıldız kategorisinde 6 keşif","need":{"count":{"cat":"Yıldız","min":6}}},
 {"id":"dunya","title":"Dünya Bakıcısı","desc":"Gezegen kategorisinde 8 keşif","need":{"count":{"cat":"Gezegen","min":8}}},
 {"id":"haberci","title":"Kozmik Haberci","desc":"Olay kategorisinde 6 keşif","need":{"count":{"cat":"Olay","min":6}}},
 {"id":"iklim","title":"İklim Çırağı","desc":"Karar kategorisinde 5 keşif","need":{"count":{"cat":"Karar","min":5}}},
 {"id":"hikayeci","title":"Kozmik Hikâyeci","desc":"40 keşif","need":{"total":{"min":40}}},
 {"id":"usta","title":"Evren Ustası","desc":"60 keşif","need":{"total":{"min":60}}},
]
json.dump({"v":1,"discoveries":D,"actions":A,"badges":BADGES}, open(os.path.join(root,"data","discoveries.json"),"w",encoding="utf-8"), ensure_ascii=False, indent=1)
from collections import Counter
print(len(D), dict(Counter(x["cat"] for x in D)), len(A), len(BADGES))
