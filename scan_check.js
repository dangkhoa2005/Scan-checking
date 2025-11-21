/* Legacy implementation (kept for reference)
document.getElementById("csvFileInput").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
        header: false, // Don't treat first row as headers initially
        skipEmptyLines: true,
        complete: function (results) {
            // Find the row that contains "Product SKU"
            let headerRowIndex = -1;
            for (let i = 0; i < results.data.length; i++) {
                const row = results.data[i];
                if (row.some(cell => cell && cell.toString().includes("Product SKU"))) {
                    headerRowIndex = i;
                    break;
                }
            }
            
            if (headerRowIndex === -1) {
                document.getElementById("fileStatus").textContent = `❌ Không tìm thấy header "Product SKU" trong file.`;
                return;
            }
            
            // Extract headers and data
            const headers = results.data[headerRowIndex];
            const dataRows = results.data.slice(headerRowIndex + 1);
            
            // Convert to objects using headers
            expectedProducts = dataRows.map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    if (header && row[index] !== undefined) {
                        obj[header] = row[index];
                    }
                });
                return obj;
            }).filter(obj => {
                const sku = obj["Product SKU"];
                if (!sku) return false; // Filter out empty rows
                
                // Filter out summary/total rows
                const skuStr = sku.toString().toLowerCase();
                const excludeKeywords = ['subtotal', 'shipping', 'tax', 'grand total', 'paid by'];
                return !excludeKeywords.some(keyword => skuStr.includes(keyword));
            });
            
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
                    const DB_ENDPOINT = "https://tpg-app-760834790636.us-west1.run.app/api/get-repair-parts/";

                    const csvFileInput = document.getElementById("csvFileInput");
                    const skuInput = document.getElementById("skuInput");
                    const log = document.getElementById("logOutput");
                    const fileStatus = document.getElementById("fileStatus");
                    const fetchDatabaseBtn = document.getElementById("fetchDatabaseBtn");
                    const dbStatus = document.getElementById("dbStatus");
                    const availableTableBody = document.querySelector("#availablePartsTable tbody");
                    const missingTableBody = document.querySelector("#missingPartsTable tbody");
                    const availableCountEl = document.getElementById("availableCount");
                    const missingCountEl = document.getElementById("missingCount");

                    let expectedProducts = [];

                    csvFileInput.addEventListener("change", handleCsvUpload);
                    fetchDatabaseBtn.addEventListener("click", handleFetchFromDatabase);

                    function handleCsvUpload(event) {
                        const file = event.target.files[0];

                        if (!file) {
                            expectedProducts = [];
                            fileStatus.textContent = "❗ Vui lòng chọn file CSV để tiếp tục.";
                            fetchDatabaseBtn.disabled = true;
                            resetComparisonTables();
                            setDbStatus("Chưa có dữ liệu để đối chiếu.", "info");
                            return;
                        }

                        Papa.parse(file, {
                            header: false,
                            skipEmptyLines: true,
                            complete: function (results) {
                                let headerRowIndex = -1;
                                for (let i = 0; i < results.data.length; i++) {
                                    const row = results.data[i];
                                    if (row.some(cell => cell && cell.toString().includes("Product SKU"))) {
                                        headerRowIndex = i;
                                        break;
                                    }
                                }

                                if (headerRowIndex === -1) {
                                    fileStatus.textContent = `❌ Không tìm thấy header "Product SKU" trong file.`;
                                    fetchDatabaseBtn.disabled = true;
                                    return;
                                }

                                const headers = results.data[headerRowIndex];
                                const dataRows = results.data.slice(headerRowIndex + 1);

                                expectedProducts = dataRows.map(row => {
                                    const obj = {};
                                    headers.forEach((header, index) => {
                                        if (header && row[index] !== undefined) {
                                            obj[header] = row[index];
                                        }
                                    });
                                    return obj;
                                }).filter(obj => {
                                    const sku = obj["Product SKU"];
                                    if (!sku) return false;
                                    const skuStr = sku.toString().toLowerCase();
                                    const excludeKeywords = ['subtotal', 'shipping', 'tax', 'grand total', 'paid by'];
                                    return !excludeKeywords.some(keyword => skuStr.includes(keyword));
                                }).map(product => {
                                    const normalizedSku = normalizeSku(product["Product SKU"]);
                                    return normalizedSku ? { ...product, _normalizedSku: normalizedSku } : null;
                                }).filter(Boolean);

                                if (!expectedProducts.length) {
                                    fileStatus.textContent = `❗ Không tìm thấy dòng sản phẩm hợp lệ trong file ${file.name}.`;
                                    fetchDatabaseBtn.disabled = true;
                                    resetComparisonTables();
                                    return;
                                }

                                fileStatus.textContent = `✅ Đã tải file ${file.name} với ${expectedProducts.length} dòng.`;
                                console.log("🔍 Dữ liệu từ CSV:", expectedProducts);

                                resetComparisonTables();
                                fetchDatabaseBtn.disabled = false;
                                setDbStatus("Sẵn sàng đối chiếu với database.", "info");

                                initScan();
                            }
                        });
                    }

                    async function handleFetchFromDatabase() {
                        if (!expectedProducts.length) {
                            setDbStatus("Vui lòng tải file CSV trước khi fetch.", "error");
                            return;
                        }

                        setDbStatus("Đang fetch dữ liệu từ database...", "info");
                        fetchDatabaseBtn.disabled = true;

                        try {
                            const response = await fetch(DB_ENDPOINT);
                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}`);
                            }

                            const payload = await response.json();
                            const databaseParts = Array.isArray(payload) ? payload : [];
                            const { available, missing } = splitPartsByAvailability(expectedProducts, databaseParts);

                            renderAvailableParts(available);
                            renderMissingParts(missing);

                            setDbStatus(`Hoàn tất đối chiếu: ${available.length} có sẵn, ${missing.length} chưa có.`, "success");
                        } catch (error) {
                            console.error("Fetch database error", error);
                            setDbStatus("Không thể fetch dữ liệu database. Vui lòng thử lại.", "error");
                        } finally {
                            fetchDatabaseBtn.disabled = expectedProducts.length === 0;
                        }
                    }

                    function splitPartsByAvailability(orderParts, dbParts) {
                        const dbMap = {};
                        dbParts.forEach(part => {
                            const skuKey = normalizeSku(part.sku);
                            if (!skuKey) return;
                            dbMap[skuKey] = part;
                        });

                        const available = [];
                        const missing = [];

                        orderParts.forEach(part => {
                            const skuKey = part._normalizedSku || normalizeSku(part["Product SKU"]);
                            if (!skuKey) return;
                            const dbMatch = dbMap[skuKey];

                            if (dbMatch) {
                                available.push({
                                    sku: skuKey,
                                    orderDescription: part["Product Description"] || "",
                                    orderQuantity: part["Quantity"] || "",
                                    dbName: dbMatch.product_name || "",
                                    dbQuantity: dbMatch.quantity ?? ""
                                });
                            } else {
                                missing.push({
                                    sku: skuKey,
                                    orderDescription: part["Product Description"] || "",
                                    orderQuantity: part["Quantity"] || ""
                                });
                            }
                        });

                        return { available, missing };
                    }

                    function renderAvailableParts(rows) {
                        if (!rows.length) {
                            availableTableBody.innerHTML = '<tr class="empty-state"><td colspan="5">Không tìm thấy SKU nào trong database.</td></tr>';
                        } else {
                            const html = rows.map(row => `
                                <tr>
                                    <td>${row.sku}</td>
                                    <td>${row.orderDescription}</td>
                                    <td>${row.orderQuantity}</td>
                                    <td>${row.dbName}</td>
                                    <td>${row.dbQuantity}</td>
                                </tr>
                            `).join("");
                            availableTableBody.innerHTML = html;
                        }
                        availableCountEl.textContent = rows.length;
                    }

                    function renderMissingParts(rows) {
                        if (!rows.length) {
                            missingTableBody.innerHTML = '<tr class="empty-state"><td colspan="3">Tất cả SKU đều đã tồn tại trong database.</td></tr>';
                        } else {
                            const html = rows.map(row => `
                                <tr>
                                    <td>${row.sku}</td>
                                    <td>${row.orderDescription}</td>
                                    <td>${row.orderQuantity}</td>
                                </tr>
                            `).join("");
                            missingTableBody.innerHTML = html;
                        }
                        missingCountEl.textContent = rows.length;
                    }

                    function resetComparisonTables() {
                        availableTableBody.innerHTML = '<tr class="empty-state"><td colspan="5">Chưa có dữ liệu</td></tr>';
                        missingTableBody.innerHTML = '<tr class="empty-state"><td colspan="3">Chưa có dữ liệu</td></tr>';
                        availableCountEl.textContent = "0";
                        missingCountEl.textContent = "0";
                    }

                    function setDbStatus(message, type = "info") {
                        if (!dbStatus) return;
                        dbStatus.textContent = message || "";
                        dbStatus.classList.remove("error", "success", "info");
                        dbStatus.classList.add(type);
                    }

                    function normalizeSku(rawValue) {
                        if (rawValue === null || rawValue === undefined) return "";
                        let str = typeof rawValue === "number" ? rawValue.toString() : rawValue.toString();
                        str = str.trim();
                        if (!str) return "";

                        const lowered = str.toLowerCase();
                        if (lowered.includes("e+")) {
                            const num = Number(str);
                            if (!Number.isNaN(num)) {
                                return Number(num.toFixed(0)).toString();
                            }
                        }

                        return str.replace(/\s+/g, "");
                    }
                    function initScan() {
                        const expectedMap = {};
                        const scannedCounts = {};

                        expectedProducts.forEach(p => {
                            const skuKey = p._normalizedSku || normalizeSku(p["Product SKU"]);
                            if (!skuKey) return;
                            expectedMap[skuKey] = p;
                            scannedCounts[skuKey] = 0;
                        });

                        skuInput.addEventListener("keydown", function(e) {
                            if (e.key === "Enter") {
                                const rawSku = skuInput.value.trim();
                                skuInput.value = "";
                                const normalizedSku = normalizeSku(rawSku);
                                if (!normalizedSku) {
                                    log.textContent += `⚠️ SKU không hợp lệ: ${rawSku}\n`;
                                    return;
                                }

                                if (expectedMap[normalizedSku]) {
                                    scannedCounts[normalizedSku]++;
                                    const expectedQty = parseFloat(expectedMap[normalizedSku]["Quantity"]);
                                    const currentQty = scannedCounts[normalizedSku];
                                    log.textContent += `✔️ ${expectedMap[normalizedSku]["Product Description"]} (${currentQty}/${expectedQty})\n`;
                                } else {
                                    log.textContent += `❌ SKU does not exist: ${rawSku}\n`;
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
*/

const DB_ENDPOINT = "https://tpg-app-760834790636.us-west1.run.app/api/get-repair-parts/";

const csvFileInput = document.getElementById("csvFileInput");
const skuInput = document.getElementById("skuInput");
const log = document.getElementById("logOutput");
const fileStatus = document.getElementById("fileStatus");
const fetchDatabaseBtn = document.getElementById("fetchDatabaseBtn");
const dbStatus = document.getElementById("dbStatus");
const availableTableBody = document.querySelector("#availablePartsTable tbody");
const missingTableBody = document.querySelector("#missingPartsTable tbody");
const availableCountEl = document.getElementById("availableCount");
const missingCountEl = document.getElementById("missingCount");

let expectedProducts = [];
const scanState = {
    expectedMap: {},
    scannedCounts: {},
    listenersAttached: false
};

csvFileInput.addEventListener("change", handleCsvUpload);
fetchDatabaseBtn.addEventListener("click", handleFetchFromDatabase);
resetComparisonTables();
setDbStatus("Chưa có dữ liệu để đối chiếu.", "info");

function handleCsvUpload(event) {
    const file = event.target.files[0];

    if (!file) {
        expectedProducts = [];
        fileStatus.textContent = "❗ Vui lòng chọn file CSV để tiếp tục.";
        fetchDatabaseBtn.disabled = true;
        resetComparisonTables();
        setDbStatus("Chưa có dữ liệu để đối chiếu.", "info");
        scanState.expectedMap = {};
        scanState.scannedCounts = {};
        return;
    }

    Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete(results) {
            let headerRowIndex = -1;
            for (let i = 0; i < results.data.length; i++) {
                const row = results.data[i];
                if (row.some(cell => cell && cell.toString().includes("Product SKU"))) {
                    headerRowIndex = i;
                    break;
                }
            }

            if (headerRowIndex === -1) {
                fileStatus.textContent = `❌ Không tìm thấy header "Product SKU" trong file.`;
                fetchDatabaseBtn.disabled = true;
                return;
            }

            const headers = results.data[headerRowIndex];
            const dataRows = results.data.slice(headerRowIndex + 1);

            expectedProducts = dataRows.map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    if (header && row[index] !== undefined) {
                        obj[header] = row[index];
                    }
                });
                return obj;
            }).filter(obj => {
                const sku = obj["Product SKU"];
                if (!sku) return false;
                const skuStr = sku.toString().toLowerCase();
                const excludeKeywords = ['subtotal', 'shipping', 'tax', 'grand total', 'paid by'];
                return !excludeKeywords.some(keyword => skuStr.includes(keyword));
            }).map(product => {
                const normalizedSku = normalizeSku(product["Product SKU"]);
                return normalizedSku ? { ...product, _normalizedSku: normalizedSku } : null;
            }).filter(Boolean);

            if (!expectedProducts.length) {
                fileStatus.textContent = `❗ Không tìm thấy dòng sản phẩm hợp lệ trong file ${file.name}.`;
                fetchDatabaseBtn.disabled = true;
                resetComparisonTables();
                setDbStatus("Chưa có dữ liệu để đối chiếu.", "info");
                return;
            }

            fileStatus.textContent = `✅ Đã tải file ${file.name} với ${expectedProducts.length} dòng.`;
            console.log("🔍 Dữ liệu từ CSV:", expectedProducts);

            resetComparisonTables();
            fetchDatabaseBtn.disabled = false;
            setDbStatus("Sẵn sàng đối chiếu với database.", "info");

            initScan();
        }
    });
}

async function handleFetchFromDatabase() {
    if (!expectedProducts.length) {
        setDbStatus("Vui lòng tải file CSV trước khi fetch.", "error");
        return;
    }

    setDbStatus("Đang fetch dữ liệu từ database...", "info");
    fetchDatabaseBtn.disabled = true;

    try {
        const response = await fetch(DB_ENDPOINT);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        const databaseParts = Array.isArray(payload) ? payload : [];
        const { available, missing } = splitPartsByAvailability(expectedProducts, databaseParts);

        renderAvailableParts(available);
        renderMissingParts(missing);

        setDbStatus(`Hoàn tất đối chiếu: ${available.length} có sẵn, ${missing.length} chưa có.`, "success");
    } catch (error) {
        console.error("Fetch database error", error);
        setDbStatus("Không thể fetch dữ liệu database. Vui lòng thử lại.", "error");
    } finally {
        fetchDatabaseBtn.disabled = expectedProducts.length === 0;
    }
}

function splitPartsByAvailability(orderParts, dbParts) {
    const dbMap = {};
    dbParts.forEach(part => {
        const skuKey = normalizeSku(part && part.sku);
        if (!skuKey) return;
        dbMap[skuKey] = part;
    });

    const available = [];
    const missing = [];

    orderParts.forEach(part => {
        const skuKey = part._normalizedSku || normalizeSku(part["Product SKU"]);
        if (!skuKey) return;
        const dbMatch = dbMap[skuKey];

        if (dbMatch) {
            available.push({
                sku: skuKey,
                orderDescription: part["Product Description"] || "",
                orderQuantity: part["Quantity"] || "",
                dbName: dbMatch.product_name || "",
                dbQuantity: dbMatch.quantity ?? ""
            });
        } else {
            missing.push({
                sku: skuKey,
                orderDescription: part["Product Description"] || "",
                orderQuantity: part["Quantity"] || ""
            });
        }
    });

    return { available, missing };
}

function initScan() {
    scanState.expectedMap = {};
    scanState.scannedCounts = {};

    expectedProducts.forEach(p => {
        const skuKey = p._normalizedSku || normalizeSku(p["Product SKU"]);
        if (!skuKey) return;
        scanState.expectedMap[skuKey] = p;
        scanState.scannedCounts[skuKey] = 0;
    });

    if (!scanState.listenersAttached) {
        skuInput.addEventListener("keydown", handleSkuEntry);
        document.addEventListener("keydown", handleChecklistShortcut);
        scanState.listenersAttached = true;
    }
}

function handleSkuEntry(event) {
    if (event.key !== "Enter") return;
    const rawSku = skuInput.value.trim();
    skuInput.value = "";
    if (!rawSku) return;

    const normalizedSku = normalizeSku(rawSku);
    if (!normalizedSku) {
        log.textContent += `⚠️ SKU không hợp lệ: ${rawSku}\n`;
        return;
    }

    const expectedProduct = scanState.expectedMap[normalizedSku];
    if (expectedProduct) {
        scanState.scannedCounts[normalizedSku]++;
        const expectedQty = parseFloat(expectedProduct["Quantity"]);
        const currentQty = scanState.scannedCounts[normalizedSku];
        log.textContent += `✔️ ${expectedProduct["Product Description"]} (${currentQty}/${expectedQty})\n`;
    } else {
        log.textContent += `❌ SKU does not exist: ${rawSku}\n`;
    }
}

function handleChecklistShortcut(event) {
    if (event.key !== "F2") return;
    log.textContent += `\n📊 Check list:\n`;
    for (const sku in scanState.expectedMap) {
        const expectedQty = parseFloat(scanState.expectedMap[sku]["Quantity"]);
        const scannedQty = scanState.scannedCounts[sku];
        const status = scannedQty === expectedQty ? "✅ Đủ" : (scannedQty < expectedQty ? "⚠️ Thiếu" : "❗ Dư");
        log.textContent += `- ${sku} (${scanState.expectedMap[sku]["Product Description"]}): ${scannedQty}/${expectedQty} → ${status}\n`;
    }
}

function renderAvailableParts(rows) {
    if (!rows.length) {
        availableTableBody.innerHTML = '<tr class="empty-state"><td colspan="5">Không tìm thấy SKU nào trong database.</td></tr>';
    } else {
        const html = rows.map(row => `
            <tr>
                <td>${row.sku}</td>
                <td>${row.orderDescription}</td>
                <td>${row.orderQuantity}</td>
                <td>${row.dbName}</td>
                <td>${row.dbQuantity}</td>
            </tr>
        `).join("");
        availableTableBody.innerHTML = html;
    }
    availableCountEl.textContent = rows.length;
}

function renderMissingParts(rows) {
    if (!rows.length) {
        missingTableBody.innerHTML = '<tr class="empty-state"><td colspan="3">Tất cả SKU đều đã tồn tại trong database.</td></tr>';
    } else {
        const html = rows.map(row => `
            <tr>
                <td>${row.sku}</td>
                <td>${row.orderDescription}</td>
                <td>${row.orderQuantity}</td>
            </tr>
        `).join("");
        missingTableBody.innerHTML = html;
    }
    missingCountEl.textContent = rows.length;
}

function resetComparisonTables() {
    availableTableBody.innerHTML = '<tr class="empty-state"><td colspan="5">Chưa có dữ liệu</td></tr>';
    missingTableBody.innerHTML = '<tr class="empty-state"><td colspan="3">Chưa có dữ liệu</td></tr>';
    availableCountEl.textContent = "0";
    missingCountEl.textContent = "0";
}

function setDbStatus(message, type = "info") {
    if (!dbStatus) return;
    dbStatus.textContent = message || "";
    dbStatus.classList.remove("error", "success", "info");
    dbStatus.classList.add(type);
}

function normalizeSku(rawValue) {
    if (rawValue === null || rawValue === undefined) return "";
    if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
        return Math.trunc(rawValue).toString();
    }

    let str = rawValue.toString().trim();
    if (!str) return "";

    const lowered = str.toLowerCase();
    if (lowered.includes("e+")) {
        const num = Number(str);
        if (!Number.isNaN(num)) {
            return Math.round(num).toString();
        }
    }

    return str.replace(/\s+/g, "");
}