document.getElementById("csvFileInput").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
        header: true, // Tự dùng dòng đầu tiên làm key
        skipEmptyLines: true,
        complete: function (results) {
            expectedProducts = results.data;
            document.getElementById("fileStatus").textContent = `✅ Đã tải file ${file.name} với ${expectedProducts.length} dòng.`;
            console.log("🔍 Dữ liệu từ CSV:", expectedProducts);

            // Sau khi có dữ liệu, khởi chạy scan
            initScan(); 
        }
    });
        // Fix SKU bị scientific notation
    expectedProducts = expectedProducts.map(p => {
        // Nếu SKU bị sai dạng, convert lại
        let rawSku = p["Product SKU"];
        if (rawSku && typeof rawSku === "string" && rawSku.includes("E+")) {
            const num = Number(rawSku);
            // Ép nó thành chuỗi số nguyên
            p["Product SKU"] = num.toFixed(0);
        }
        return p;
});

});



let expectedProducts = [];

    fetch("orderJSON.json")
        .then(response => response.json())
        .then(data => {
            expectedProducts = data;
            console.log("✅ Đã load xong JSON:", expectedProducts);

            // scan file after load file JSON
            initScan();
        });


    function initScan() {
        const expectedMap = {};
        const scannedCounts = {};

        expectedProducts.forEach(p => {
            expectedMap[p["Product SKU"]] = p;
            scannedCounts[p["Product SKU"]] = 0;
        });

        const input = document.getElementById("skuInput");
        const log = document.getElementById("logOutput");

        input.addEventListener("keydown", function(e) {
            if (e.key === "Enter") {
                const sku = input.value.trim();
                input.value = "";

                if (expectedMap[sku]) {
                    scannedCounts[sku]++;
                    const expectedQty = parseFloat(expectedMap[sku]["Quantity"]);
                    const currentQty = scannedCounts[sku];
                    log.textContent += `✔️ ${expectedMap[sku]["Product Description"]} (${currentQty}/${expectedQty})\n`;
                } else {
                    log.textContent += `❌ SKU does not exist: ${sku}\n`;
                }
            }
        });

        
        document.addEventListener("keydown", function(e) {
            if (e.key === "F2") {
                log.textContent += `\n📊 Check list:\n`;
                for (const sku in expectedMap) {
                    const expectedQty = parseFloat(expectedMap[sku]["Quantity"]);
                    const scannedQty = scannedCounts[sku];
                    const status = scannedQty === expectedQty ? "✅ Đủ" : (scannedQty < expectedQty ? "⚠️ Thiếu" : "❗ Dư");
                    log.textContent += `- ${sku} (${expectedMap[sku]["Product Description"]}): ${scannedQty}/${expectedQty} → ${status}\n`;
                }
            }
        });
    }