async function check() {
  try {
    const res = await fetch("https://raw.githubusercontent.com/DEX-1101/czn-unigram/main/asset/send.wav");
    console.log("Status:", res.status);
    console.log("CORS:", res.headers.get("access-control-allow-origin"));
  } catch (e) {
    console.error("Error:", e);
  }
}
check();
