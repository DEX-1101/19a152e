async function check() {
  try {
    const res = await fetch("https://cdn.jsdelivr.net/gh/DEX-1101/czn-unigram@main/asset/send.wav");
    console.log("Status:", res.status);
  } catch (e) {
    console.error("Error:", e);
  }
}
check();
