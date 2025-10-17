document.getElementById("lookupBtn").addEventListener("click", async () => {
    const input = document.getElementById("ipInput").value.trim();
    const ips = input.split("\n").map(ip => ip.trim()).filter(ip => ip);
    const tbody = document.querySelector("#resultTable tbody");
    tbody.innerHTML = ""; // Clear previous results

    for (const ip of ips) {
        try {
            const res = await fetch(`http://ip-api.com/json/${ip}`);
            const data = await res.json();
            const row = document.createElement("tr");

            if (data.status === "success") {
                row.innerHTML = `
                    <td>${ip}</td>
                    <td>${data.isp}</td>
                    <td>${data.org}</td>
                    <td>${data.country}</td>
                    <td>${data.regionName}</td>
                    <td>${data.city}</td>
                    <td>${data.lat}</td>
                    <td>${data.lon}</td>
                `;
            } else {
                row.innerHTML = `<td>${ip}</td><td colspan="7">Failed</td>`;
            }

            tbody.appendChild(row);
        } catch (err) {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${ip}</td><td colspan="7">Error</td>`;
            tbody.appendChild(row);
        }
    }
    alert("Done!");
});

// ===== Export Table to Excel =====
document.getElementById("exportBtn").addEventListener("click", () => {
    const table = document.getElementById("resultTable");
    const wb = XLSX.utils.table_to_book(table, { sheet: "IP Details" });
    XLSX.writeFile(wb, "IP_Lookup_Result.xlsx");
});