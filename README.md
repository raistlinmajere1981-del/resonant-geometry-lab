# Resonant Geometry Lab

Resonant Geometry Lab (RGL), geometrik desenleri ölçmek, sayısallaştırmak ve rezonans/frekans modelleriyle karşılaştırmak için geliştirilen yerel bir araştırma aracıdır.

İlk kullanım alanı ekin çemberi görüntüleridir; ancak veri modeli herhangi bir tek desene veya ekin çemberlerine özel olmayacaktır. Amaç, görüntüden bağımsız bir geometrik temsil oluşturmak ve aynı temsili 2D analiz, 3D görselleştirme ve fiziksel/sayısal simülasyonlar arasında kullanmaktır.

## Tasarım ilkeleri

- **Model UI'den bağımsızdır.** Geometri ve simülasyon verileri görünüm katmanından ayrı tutulur.
- **2D ve 3D aynı veriyi okur.** Fotoğraf overlay'i, vektör görünümü ve Babylon tabanlı 3D görünüm aynı proje verisinin farklı adaptörleridir.
- **Yeni yetenekler UI'yi büyütmez.** Analizler ve görünümler bağlama göre açılan araç/panel modülleri olarak eklenir.
- **Kaynak görüntü yalnızca girdidir.** Ölçümler normalize koordinatlarda saklanır; fotoğraf çözünürlüğüne bağlı kalmaz.
- **İnsan kontrolü önceliklidir.** Otomatik algılama öneri üretir; manuel düzeltme ve onay esas veri kaynağıdır.
- **Tek bir desene göre mimari kurulmaz.** Circle, ellipse, point, line, arc, polyline, polygon ve region gibi genel primitive'ler kullanılır.
- **Karşılaştırma tek puana indirgenmez.** Geometri, simetri, radyal profil, topoloji ve negatif alan gibi bileşenler ayrı raporlanır.

## Ana çalışma alanları

### Geometry

Görüntü yükleme, perspektif/ölçek hazırlığı, primitive işaretleme, ölçüm, polar koordinatlar, simetri, negatif alan ve yapısal analiz.

### Resonance

İlk aşamada Chladni/plaka ve dairesel membran modelleri. Daha sonra su yüzeyi, çoklu kaynak, çoklu frekans ve faz ilişkileri eklenebilir.

### Compare

Gerçek geometrik veri ile simülasyon çıktısını translation/rotation/scale altında hizalama ve çoklu metriklerle karşılaştırma.

## UI yaklaşımı

Ana ekran sabit bir çalışma kabuğu kullanır:

- büyük bir ana viewport,
- bağlama göre değişen sağ panel,
- küçük bir proje/katman/durum alanı.

Ana viewport gerektiğinde 2D fotoğraf + overlay, saf vektör görünümü, rezonans haritası veya Babylon.js 3D sahnesi gösterebilir. Babylon.js uygulamanın genel UI sistemi değil, yalnızca 3D analiz/görselleştirme adaptörüdür.

## v0.1 sınırı

İlk sürüm bilinçli olarak küçüktür:

1. Görüntü yükleme ve proje oluşturma.
2. Manuel primitive işaretleme; circle ile başlanır, veri modeli diğer primitive türlerini destekler.
3. Normalize koordinatlar ve temel ölçümler.
4. Merkez/polar ölçüm ve temel dönel simetri analizi.
5. Basit negatif alan temsili için altyapı.
6. Dairesel membran veya basit Chladni benzeri bir modal simülasyon.
7. 2D gerçek geometri ile simülasyon overlay'i ve temel karşılaştırma metrikleri.
8. Aynı simülasyon sonucunun Babylon.js ile isteğe bağlı 3D yüzey görünümü.

π/φ/e sabit taraması, Voronoi/Delaunay, gelişmiş sekans analizi, su dalgaları, çoklu frekans, otomatik model arama ve geniş desen ailesi sınıflandırması v0.1 kapsamı dışındadır.

## İlk geliştirme sırası

RGL aceleyle özellik eklemek yerine katman katman kurulacaktır:

**Aşama 0 — Foundation**  
Proje sözleşmesi, veri modeli, UI shell ve test edilebilir çekirdek.

**Aşama 1 — Geometry Workspace**  
Görüntü + 2D viewport + manuel circle anotasyonu + ölçüm.

**Aşama 2 — Geometry Analysis**  
Merkez, polar ölçümler, simetri ve negatif alanın ilk sürümü.

**Aşama 3 — Resonance Workspace**  
Modal simülasyon çekirdeği ve 2D çıktı.

**Aşama 4 — 3D View Adapter**  
Babylon.js ile simülasyon yüzeyi ve kamera preset'leri.

**Aşama 5 — Compare Workspace**  
Geometri/simülasyon hizalama ve çoklu karşılaştırma metrikleri.

Her aşama yerelde test edilip doğrulandıktan sonra bir sonraki aşamaya geçilir.

## Geliştirme yaklaşımı

Bu depo kişisel araştırma aracı olarak geliştirilir. Dağıtım, hesap sistemi, çok kullanıcılı güvenlik, bulut altyapısı veya ürünleştirme v0.1 hedefi değildir. Öncelik; okunabilirlik, ölçüm güvenilirliği, geri alınabilir çalışma akışı ve gelecekte yeni analiz modülleri eklenebilmesidir.
