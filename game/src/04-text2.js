/* SpacEgg 2.0 — sistem geneli metinler (SG.T2). Üslup: sakin, meraklı, bilimsel dürüst; aciliyet dili yok. */
(function(){'use strict';
window.SG=window.SG||{};
SG.T2={
slogan:'Create a universe. Witness its story.',
sloganTr:'Hiçlikten bir evren yarat. Galaksileri keşfet. Yıldızların ve dünyaların hikâyesini şekillendir.',
name:'SpacEgg',
sub:'Evren Yaratma Simülatörü',
scales:{
 universe:{name:'Evren',short:'Galaksilerin dağıldığı en büyük ölçek.'},
 galaxy:{name:'Galaksi',short:'Milyarlarca yıldızdan yalnız küçük bir kesit görünür.'},
 system:{name:'Yıldız sistemi',short:'Bir yıldız ve çevresinde dönen gezegenler.'},
 planet:{name:'Gezegen',short:'Yüzey, atmosfer, su ve iklim.'}
},
tags:{
 gercek:{name:'Gerçek',desc:'Bilimsel olarak bilinen bir olgu ya da ölçüye dayanır.'},
 basit:{name:'Basitleştirilmiş',desc:'Gerçeğin oyun için sadeleştirilmiş hâlidir; sayılar yaklaşıktır.'},
 kurgu:{name:'Kurgu',desc:'Oyunun hikâyesi için uydurulmuştur; bilimsel bir iddia taşımaz.'}
},
onboard:[
 {id:'olcek',target:'scale',title:'Ölçekler arasında gez',text:'İki parmağınla yaklaştır ya da uzaklaştır. Evrenden gezegene kesintisiz inebilirsin.'},
 {id:'sec',target:'canvas',title:'Bir nesneye dokun',text:'Dokunduğun galaksi, yıldız ya da gezegen hakkında bilgi görürsün. Her gözlem biraz daha fazlasını açar.'},
 {id:'zaman',target:'speed',title:'Zamanı sen yönet',text:'Zamanı durdurabilir ya da hızlandırabilirsin. Yıldızlar milyonlarca yılda değişir; sabırlı olmana gerek yok.'},
 {id:'gunluk',target:'tabs',title:'Evrenin hikâyesi kayıtta',text:'Keşifler ve olaylar Günlük sekmesinde birikir. Evrenin kendiliğinden kaydedilir; istersen yedekleyebilirsin.'}
],
create:{
 title:'Yeni evren',
 lead:'Bir tohum seç; evrenin hâli ona göre belirlenir. Aynı tohum her zaman aynı evreni verir.',
 fields:{name:'Evrenin adı',seed:'Tohum',preset:'Başlangıç koşulları'},
 placeholders:{name:'Örn. Sessiz Kıyı',seed:'Boş bırakırsan rastgele seçilir'},
 seedHelp:'Tohum, evreninin kimliğidir. Aynısını arkadaşınla paylaşırsan aynı galaksileri görürsünüz.',
 random:'Rastgele tohum',
 presets:{
  sakin:{name:'Sakin',desc:'Dengeli yıldız yoğunluğu. Keşfe yeni başlayanlar için uygun.'},
  yogun:{name:'Yoğun',desc:'Sık yıldızlar ve çok gezegen. Daha kalabalık bir gökyüzü.'},
  seyrek:{name:'Seyrek',desc:'Az yıldız, geniş boşluklar. Her bulgu daha nadir.'}
 },
 start:'Evreni başlat',
 back:'Geri',
 bigBang:[
  'Önce hiçbir şey yoktu.',
  'Bir an, sonsuz derecede yoğun bir nokta.',
  'Sonra genişleme başladı.',
  'Işık ilk kez yol alabildi.',
  'Gaz bulutları yıldızlara dönüştü.',
  'Galaksiler yerini buldu. Evrenin hazır.'
 ],
 errors:{name:'Evrene bir ad ver.',seed:'Tohum en çok 32 karakter olabilir.'}
},
journal:{
 title:'Günlük',
 empty:'Henüz bir kayıt yok. Bir yıldıza ya da gezegene dokunarak ilk gözlemini yap.',
 emptyEvents:'Zaman akarken burada olaylar belirecek.',
 cats:{all:'Tümü',events:'Olaylar',discoveries:'Keşifler',decisions:'Kararlar'},
 progress:'Keşif ilerlemesi',
 goals:'Sıradaki ipuçları',
 timeLabel:'Kozmik zaman'
},
saves:{
 title:'Kayıtlar',
 current:'Açık evren',
 empty:'Henüz kayıtlı bir evrenin yok.',
 open:'Aç',rename:'Yeniden adlandır',remove:'Sil',
 removeConfirm:'Bu evren silinecek. Önce dışa aktarıp saklayabilirsin.',
 auto:'Evren otomatik kaydedilir.',
 export:{title:'Dışa aktar',help:'Aşağıdaki metni kopyala ve güvenli bir yere yapıştır. İstediğin zaman geri yükleyebilirsin.',copy:'Kopyala',copied:'Kopyalandı.'},
 import:{title:'İçe aktar',help:'Daha önce dışa aktardığın metni buraya yapıştır.',placeholder:'SGU2: ile başlayan metin',button:'Geri yükle',ok:'Evren geri yüklendi.',bad:'Bu metin geçerli bir SpacEgg kaydı gibi görünmüyor.'},
 backups:{title:'Yedekler',help:'Son üç kayıt dönüşümlü saklanır.',restore:'Bu yedeğe dön',none:'Henüz yedek yok.'},
 corrupt:'Bir kayıt okunamadı. Sağlam olan son yedeğe dönüldü; bozuk kopya silinmeden ayrı tutuldu.',
 saved:'Kaydedildi.'
},
prefs:{
 title:'Ayarlar',
 access:{title:'Erişilebilirlik',
  rm:{name:'Hareketi azalt',desc:'Parçacıkları ve sürekli hareketi kapatır, geçişleri kısaltır.'},
  contrast:{name:'Yüksek kontrast',desc:'Metin ve çerçeveleri daha belirgin yapar.'},
  scale:{name:'Yazı boyutu',desc:'Arayüz yazılarını büyütür.',opts:['%100','%125','%150']},
  list:{name:'Liste görünümü',desc:'Nesneleri çizim yerine liste olarak gösterir; ekran okuyucu ve klavye için uygundur.'}},
 sound:{title:'Ses',master:'Genel ses',music:'Müzik',fx:'Efektler',mute:'Sessiz'},
 quality:{title:'Görsel kalite',auto:'Otomatik',low:'Düşük',mid:'Orta',high:'Yüksek',
  desc:{auto:'Cihazın hızına göre kendi ayarlanır.',low:'Pil ve ısı için en hafif ayar.',mid:'Denge.',high:'En ayrıntılı görünüm.'}},
 legacy:{title:'Eski SpacEgg (v1)',desc:'Yumurtadan gezegen büyüttüğün önceki oyun korunuyor. Verilerine dokunulmadı.',open:'Eski oyunu aç'},
 account:{title:'Hesap',logout:'Çıkış yap'},
 about:'Hakkında'
},
speed:{
 labels:['Duraklat','1×','10×','100×','1000×'],
 short:['⏸','1×','10×','100×','1000×'],
 aria:['Zamanı durdur','Zaman 1 kat hızlı','Zaman 10 kat hızlı','Zaman 100 kat hızlı','Zaman 1000 kat hızlı'],
 unit:'saniyede milyon yıl',
 paused:'Zaman duruyor'
},
info:{
 levels:['Belirsiz','Biraz biliniyor','İyi biliniyor','Tam biliniyor'],
 observe:'Gözlemle',
 unknown:'Henüz bilinmiyor. Gözlemledikçe açılır.',
 decisions:'Kararlar',
 close:'Kapat'
},
errors:{
 generic:'Bir şey ters gitti. Evrenin güvende; tekrar dene.',
 noSave:'Kayıt alanı kullanılamıyor. Evren yalnız bu oturumda saklanır.',
 render:'Çizim başlatılamadı. Ayarlardan görsel kaliteyi düşürmeyi dene.',
 import:'Bu kayıt okunamadı.'
},
about:{
 dev:'Fambo tarafından geliştirildi',
 vision:'SpacEgg, ölçeğin hissini ve keşfin sakin heyecanını anlatmayı amaçlayan bir evren simülasyonudur. Bilimden ilham alır; basitleştirdiği ve uydurduğu yerleri açıkça belirtir.',
 principles:['Merak baskıdan önce gelir.','İlerleme ödemeye bağlı değildir.','Gerçek, basitleştirme ve kurgu ayrı etiketlenir.']
},
tabs:{universe:'Evren',journal:'Günlük',saves:'Kayıtlar',prefs:'Ayarlar'},
crumbs:{sep:'›'},
events:{
 supernova:'Bir yıldız süpernova olarak patladı.',
 nova:'Bir yıldız ani biçimde parladı.',
 comet:'Bir kuyruklu yıldız sistemin içinden geçti.',
 nebula:'Bir gaz bulutu yoğunlaşıyor.',
 'stellar-birth':'Yeni bir yıldız doğdu.',
 'star-dies':'Bir yıldız yaşamının sonuna geldi.',
 'habitable-shift':'Bir gezegenin yaşanabilirliği değişti.',
 collision:'İki cisim çarpıştı.'
}
};
})();
