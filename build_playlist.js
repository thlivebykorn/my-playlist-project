const fs = require('fs');

async function main() {
  const apiUrl = "https://api.ppv.st/api/streams";

  try {
    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Referer": "https://ppv.st/"
      }
    });

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();

    if (!data || !Array.isArray(data.streams)) {
      throw new Error("Invalid structure or IP blocked");
    }

    const groupsMap = {};

    data.streams.forEach(categoryGroup => {
      const categoryName = categoryGroup.category || "ทั่วไป";
      const innerStreams = Array.isArray(categoryGroup.streams) ? categoryGroup.streams : [];

      innerStreams.forEach(item => {
        const tag = item.tag || item.category_name || categoryName;
        const name = item.name || "";
        const poster = item.poster || "https://board.dookeela.live/wp-content/uploads/2024/07/cropped-favicon-32x32-1.png";
        const uriName = item.uri_name || "";

        if (!uriName && !name) return;

        if (!groupsMap[tag]) {
          groupsMap[tag] = {
            name: tag,
            image: "https://board.dookeela.live/wp-content/uploads/2024/07/cropped-favicon-32x32-1.png",
            stations: []
          };
        }

        const streamUrl = `https://ppv.st/live/${uriName}`;

        groupsMap[tag].stations.push({
          name: name,
          image: poster,
          url: streamUrl,
          referer: streamUrl,
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
          playInNatPlayer: "true"
        });
      });
    });

    const playlist = {
      name: "ทีวีแจกฟรีห้ามขาย",
      image: "https://board.dookeela.live/wp-content/uploads/2024/07/cropped-favicon-32x32-1.png",
      groups: Object.values(groupsMap)
    };

    fs.writeFileSync('playlist.json', JSON.stringify(playlist, null, 2), 'utf-8');
    console.log("บันทึกไฟล์ playlist.json สำเร็จ!");

  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err.message);
    process.exit(1);
  }
}

main();
