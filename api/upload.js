async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const resultBox = document.getElementById("result");
  const popup = document.getElementById("popup");
  const loading = document.getElementById("loading");

  if (!fileInput.files.length) {
    showPopup("❌ Pilih file terlebih dahulu!");
    return;
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("reqtype", "fileupload");
  formData.append("fileToUpload", file);

  loading.style.display = "block";
  resultBox.innerHTML = "";

  try {
    const res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: formData
    });

    const link = await res.text();
    loading.style.display = "none";

    if (link.startsWith("http")) {
      resultBox.innerHTML = `<b>✅ Link berhasil dibuat:</b><br><a href="${link}" target="_blank">${link}</a>`;
      showPopup("✅ Upload berhasil!");
    } else {
      resultBox.innerHTML = "❌ Gagal mengupload file.";
      showPopup("❌ Upload gagal!");
    }
  } catch (e) {
    loading.style.display = "none";
    resultBox.innerHTML = "⚠️ Terjadi kesalahan koneksi.";
    showPopup("⚠️ Koneksi error!");
  }
}

function showPopup(msg) {
  const popup = document.getElementById("popup");
  popup.innerText = msg;
  popup.classList.add("show");
  setTimeout(() => popup.classList.remove("show"), 3000);
}
