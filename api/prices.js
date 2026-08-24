<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Altın Portföy</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background: #f7f5f0;
      color: #111;
    }

    .container {
      width: min(1140px, calc(100% - 40px));
      margin: 0 auto;
    }

    header {
      padding: 26px 0 30px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .logo {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: #c99b32;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 21px;
      font-weight: bold;
    }

    .brand h1 {
      margin: 0;
      font-size: 24px;
    }

    .brand p {
      margin: 4px 0 0;
      color: #777;
      font-size: 13px;
    }

    button {
      border: 0;
      cursor: pointer;
      font-weight: 700;
    }

    .login-btn {
      background: #151515;
      color: white;
      padding: 11px 20px;
      border-radius: 12px;
    }

    .status {
      background: white;
      border: 1px solid #e6dfd2;
      border-radius: 20px;
      padding: 28px 26px;
      margin-bottom: 26px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .status h2 {
      margin: 0 0 7px;
      font-size: 18px;
    }

    .updated {
      color: #777;
      font-size: 13px;
    }

    .live {
      color: #238b45;
      font-weight: 700;
      font-size: 13px;
    }

    .live::before {
      content: "";
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #2ca65a;
      border-radius: 50%;
      margin-right: 7px;
    }

    .offline {
      color: #b43b32;
    }

    .prices {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }

    .card {
      background: white;
      border: 1px solid #e6dfd2;
      border-radius: 18px;
      padding: 22px 20px;
      min-height: 190px;
    }

    .card h3 {
      margin: 0 0 5px;
      font-size: 16px;
    }

    .unit {
      color: #888;
      font-size: 13px;
    }

    .main-price {
      font-size: 28px;
      font-weight: 800;
      margin: 25px 0 18px;
    }

    .row {
      border-top: 1px solid #eee9e0;
      padding: 9px 0;
      display: flex;
      justify-content: space-between;
      font-size: 13px;
    }

    .row span:first-child {
      color: #777;
    }

    .portfolio-section {
      margin-top: 40px;
      padding-bottom: 60px;
    }

    .portfolio-section h2 {
      font-size: 18px;
      margin-bottom: 14px;
    }

    .login-message {
      background: #f5ead1;
      border: 1px solid #ead7b1;
      border-radius: 16px;
      padding: 18px;
      color: #725a27;
      font-size: 14px;
    }

    .error {
      background: #fff0ee;
      border: 1px solid #ecc5c0;
      color: #9d332b;
      padding: 14px 18px;
      border-radius: 14px;
      margin-bottom: 20px;
      display: none;
    }

    @media (max-width: 800px) {
      .prices {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 550px) {
      .container {
        width: min(100% - 24px, 1140px);
      }

      header {
        padding-top: 18px;
      }

      .brand h1 {
        font-size: 20px;
      }

      .prices {
        grid-template-columns: 1fr;
      }

      .status {
        padding: 22px 18px;
      }

      .main-price {
        font-size: 26px;
      }
    }
  </style>
</head>

<body>

  <div class="container">

    <header>
      <div class="brand">
        <div class="logo">₺</div>

        <div>
          <h1>Altın Portföy</h1>
          <p>Canlı fiyatlar ve kişisel portföy takibi</p>
        </div>
      </div>

      <button
        class="login-btn"
        onclick="login()">
        Giriş Yap
      </button>
    </header>


    <section class="status">

      <div>
        <h2>Canlı Altın Fiyatları</h2>

        <div
          id="updated"
          class="updated">
          Fiyatlar yükleniyor...
        </div>
      </div>

      <div
        id="status"
        class="live">
        CANLI
      </div>

    </section>


    <div
      id="error"
      class="error">
    </div>


    <section
      id="prices"
      class="prices">

      <!-- JavaScript dolduracak -->

    </section>


    <section class="portfolio-section">

      <h2>Portföyüm</h2>

      <div class="login-message">

        <strong>Portföyünü görmek için giriş yap.</strong>

        <br>

        Google veya e-posta ile giriş yaptıktan sonra
        elindeki altınların adet/gram miktarını kaydedebilir
        ve toplam portföy değerini canlı takip edebilirsin.

      </div>

    </section>

  </div>


<script>

  /*
   * SİTEDE GÖSTERİLECEK ÜRÜNLER
   *
   * API ile birebir aynı code değerleri kullanılıyor.
   */

  const PRODUCTS = [

    {
      code: "ALTIN",
      name: "24 Ayar Gram Altın",
      unit: "Gram"
    },

    {
      code: "22AYAR",
      name: "22 Ayar Altın",
      unit: "Gram"
    },

    {
      code: "BILEZIK22",
      name: "22 Ayar Bilezik Gram Fiyatı",
      unit: "Gram"
    },

    {
      code: "CEYREK",
      name: "Çeyrek Altın",
      unit: "Adet"
    },

    {
      code: "YARIM",
      name: "Yarım Altın",
      unit: "Adet"
    },

    {
      code: "TAM",
      name: "Tam Altın",
      unit: "Adet"
    },

    {
      code: "ATA",
      name: "Ata Altın",
      unit: "Adet"
    },

    {
      code: "CUMHURIYET",
      name: "Cumhuriyet Altını",
      unit: "Adet"
    }

  ];


  /*
   * TL FORMAT
   */

  function formatTL(value) {

    if (
      value === null ||
      value === undefined ||
      !Number.isFinite(Number(value))
    ) {
      return "—";
    }

    return new Intl.NumberFormat(
      "tr-TR",
      {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    ).format(Number(value));

  }


  /*
   * FİYAT KARTI
   */

  function createCard(product, item) {

    const alis =
      item && item.alis !== null
        ? Number(item.alis)
        : null;

    const satis =
      item && item.satis !== null
        ? Number(item.satis)
        : null;


    return `

      <div class="card">

        <h3>
          ${product.name}
        </h3>

        <div class="unit">
          ${product.unit}
        </div>


        <div class="main-price">
          ${formatTL(satis)}
        </div>


        <div class="row">
          <span>Alış</span>
          <strong>
            ${formatTL(alis)}
          </strong>
        </div>


        <div class="row">
          <span>Satış</span>
          <strong>
            ${formatTL(satis)}
          </strong>
        </div>

      </div>

    `;

  }


  /*
   * FİYATLARI YÜKLE
   */

  async function loadPrices() {

    const errorBox =
      document.getElementById("error");

    const status =
      document.getElementById("status");

    try {

      errorBox.style.display = "none";

      const response =
        await fetch(
          "/api/prices?t=" +
          Date.now(),
          {
            cache: "no-store"
          }
        );


      const result =
        await response.json();


      if (!response.ok) {

        throw new Error(
          result.error ||
          "Fiyatlar alınamadı."
        );

      }


      /*
       * API:
       *
       * {
       *   source,
       *   updated_at,
       *   data: [...]
       * }
       */

      const data =
        Array.isArray(result.data)
          ? result.data
          : [];


      /*
       * API verisini MAP yapıyoruz.
       */

      const priceMap =
        new Map();

      data.forEach(item => {

        if (item && item.code) {

          priceMap.set(
            String(item.code).toUpperCase(),
            item
          );

        }

      });


      /*
       * KARTLARI OLUŞTUR
       */

      const html =
        PRODUCTS
          .map(product => {

            const item =
              priceMap.get(
                product.code
              );

            return createCard(
              product,
              item
            );

          })
          .join("");


      document.getElementById(
        "prices"
      ).innerHTML = html;


      /*
       * GÜNCELLEME ZAMANI
       */

      const date =
        result.updated_at
          ? new Date(result.updated_at)
          : new Date();


      document.getElementById(
        "updated"
      ).textContent =
        "Son güncelleme: " +
        date.toLocaleTimeString(
          "tr-TR",
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          }
        );


      status.textContent =
        "CANLI";

      status.className =
        "live";


    } catch (error) {

      console.error(error);

      status.textContent =
        "BAĞLANTI HATASI";

      status.className =
        "live offline";


      errorBox.textContent =
        "Fiyatlar alınamadı: " +
        error.message;

      errorBox.style.display =
        "block";

    }

  }


  /*
   * GİRİŞ
   *
   * Şimdilik mevcut giriş ekranına yönlendirme.
   */

  function login() {

    alert(
      "Google / e-posta giriş sistemi sonraki adımda bağlanacak."
    );

  }


  /*
   * İLK YÜKLEME
   */

  loadPrices();


  /*
   * HER 30 SANİYEDE BİR GÜNCELLE
   */

  setInterval(
    loadPrices,
    30000
  );

</script>

</body>
</html>
