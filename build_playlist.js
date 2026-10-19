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

        // ❌ เงื่อนไข: ไม่ดึงกลุ่มหรือแท็กที่เป็น "24/7 channel"
        if (tag.toLowerCase() === "24/7 channel") return;

        let rawName = item.name || "";

        // จัดการปรับแต่งคำว่า "vs." หรืออักษรพิเศษตามต้องการ (เช่น เปลี่ยน vs. เป็น -)
        rawName = rawName.replace(/\bvs\.?\b/gi, "-");

        // 🕒 แปลงเวลา starts_at (Unix Timestamp) เป็นเวลาไทย (HH:mm) แล้วใส่ไว้ข้างหน้า
        let displayName = rawName;
        if (item.starts_at && item.starts_at > 0) {
          const date = new Date(item.starts_at * 1000);
          // ปรับเป็นเวลาประเทศไทย (UTC+7)
          const timeString = date.toLocaleTimeString('th-TH', {
            timeZone: 'Asia/Bangkok',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          displayName = `${timeString} ${rawName}`;
        }

        const poster = item.poster || "https://board.dookeela.live/wp-content/uploads/2024/07/cropped-favicon-32x32-1.png";
        const uriName = item.uri_name || "";

        if (!uriName && !rawName) return;

        if (!groupsMap[tag]) {
          groupsMap[tag] = {
            name: tag,
            image: "https://board.dookeela.live/wp-content/uploads/2024/07/cropped-favicon-32x32-1.png",
            stations: []
          };
        }

        const streamUrl = `https://ppv.st/live/${uriName}`;

        groupsMap[tag].stations.push({
          name: displayName, // ชื่อที่มีเวลาแปะด้านหน้าเรียบร้อย
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
