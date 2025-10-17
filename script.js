function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

document.getElementById("lookupBtn").addEventListener("click", async () => {
    const input = document.getElementById("ipInput").value.trim();
    const ips = input.split("\n").map(ip => ip.trim()).filter(ip => ip);
    const tbody = document.querySelector("#resultTable tbody");
    tbody.innerHTML = "";

    for (const ip of ips) {
        try {
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`http://ip-api.com/json/${ip}`)}`);
            const json = await res.json();
            const data = JSON.parse(json.contents);
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

        // Wait 1500ms (1.5 seconds) between each request to avoid rate limit
        await delay(2000);
    }

    alert("Done!");
});
