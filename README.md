<h1>Messaging Service</h1>

<h2>Açıklama</h3>
<p>Rest ve socket tabanlı basit mesajlaşma servisi</p>
<p>Kullanıcıların mesajlarının anlık olarak iletilmesini ve eski mesajları istenildiğinde sunmayı sağlar</p>
<p>Uygulama 8000 portundan çalışmaktadır.</p>
<p>docker-compose up komutu ile ayağa kaldırılabilir</p>

<h2>End Pointler</h2>
<p>Bütün istekler http://localhost:8000/ ile başlayan url e atılmalıdır</p>
<p>Bütün isteklere yanıt olarak result adında bir parametre gönderilmektedir. Result genel olarak yapılan isteğin başarılı olup olmadığını kontrol etmeye yarar eğer result boş bir string e eşit değilse hata bulunmuştur ve o mesajı içeriyordur</p>
<h3>Register</h3>
<p>method:post</p>
<p>path:register</p>
<p>Gerekli Fieldlar</p>
<ul>
    <li>username:string</li>
    <li>password:string</li>
    <li>firstname:string</li>
    <li>lastname:string</li>
</ul>
<h3>Login</h3>
<p>method:post</p>
<p>path:login</p>
<p>Gerekli Fieldlar</p>
<ul>
    <li>username:string</li>
    <li>password:string</li>
</ul>
<h3>Block</h3>
<p>method:post</p>
<p>path:block</p>
<p>Gerekli Fieldlar</p>
<ul>
    <li>token:string(JWT)</li>
    <li>username:string</li>
</ul>
<h3>Unblock</h3>
<p>method:post</p>
<p>path:unblock</p>
<p>Gerekli Fieldlar</p>
<ul>
    <li>token:string(JWT)</li>
    <li>username:string</li>
</ul>
<h3>Send Message</h3>
<p>method:post</p>
<p>path:sendMessage</p>
<p>Gerekli Fieldlar</p>
<ul>
    <li>token:string(JWT)</li>
    <li>receiverName:string</li>
    <li>content:string</li>
</ul>
<h3>Get Messages</h3>
<p>method:get</p>
<p>path:getMessages</p>
<p>Gerekli Fieldlar</p>
<ul>
    <li>token:string(JWT)</li>
    <li>username:string</li>
</ul>
<h3>Get Unread Messages</h3>
<p>method:get</p>
<p>path:getUnReadMessages</p>
<p>Gerekli Fieldlar</p>
<ul>
    <li>token:string(JWT)</li>
</ul>

<h2>Anlık Mesajlaşma</h2>
<p>Anlık mesajlaşma denemesi için bir client.py scripti mevcut çok basit bir halde test etmek için kullanıldı. Sunucudan gelen cevapları dinleyip console a basan basit bir script.</p>
<p>Command line argument olarak login sonrası verilen jwt ye ihtiyaç duymaktadır.</p>
<p>Çalıştırmak için python3.6 nın kurulu olması ve socketio-python paketinin kurulu olması gerekmektedir</p>


<h2>Testler</h2>
<p>Testler genel olarak end point fonksiyonlarını kapsamaktadır. Web socket ile iletişime geçilen kısım için ayrıca test implemente edilmedi.</p>
<p>Testler sonucunda projenin olduğu dizinde coverage adlı bir klasör oluşur. Bu coverage klasörünün içindeki index.html tarayıcı açıldığında coverage raporu güzel bir şekilde görülebilir. Aynı zamanda test sonuçları text formatında da console a basılmaktadır.</p>
<p><strong>Test ortamını çalıştırmak için docker-compose.yml dosyasındaki Dockerfile ismi Dockerfile.test ile değiştirilmelidir.</strong></p>


<h2>Loglar</h2>
<p>Sistemde iki ayrı log dosyası mevcuttur. Uygulamanın çalıştığı dizinde ws.log ve app.log adlı iki log dosyası mevcuttur.</p>
<p>Rest endpointlerine gelen istekler app.log a yazılırken anlık mesajlaşmanın kullanıldığı kısımlar ws.log a yazılmaktadır.</p>

