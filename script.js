// Global variable to store the successfully retrieved data for export
let ipLookupResults = []; 

/**
 * Creates a delay (pause) for a specified number of milliseconds.
 * Used to manage the rate limit for the IP API service (45 requests/minute).
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- IP Lookup Logic ---
document.getElementById("lookupBtn").addEventListener("click", async () => {
    // Get and sanitize input (split by new line, trim whitespace, filter out empty lines)
    const input = document.getElementById("ipInput").value.trim();
    const ips = input.split("\n").map(ip => ip.trim()).filter(ip => ip);
    
    const tbody = document.querySelector("#resultTable tbody");
    tbody.innerHTML = ""; // Clear existing table rows
    ipLookupResults = []; // Clear previous results for the new run

    for (const ip of ips) {
        // Prepare a default row object for data storage (in case of failure)
        let dataRow = {
            ip: ip,
            isp: "N/A",
            org: "N/A",
            country: "N/A",
            regionName: "N/A",
            city: "N/A",
            lat: "N/A",
            lon: "N/A"
        };
        const row = document.createElement("tr");

        try {
            // Use CORS proxy (allorigins.win) to bypass cross-origin restrictions
            const apiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`http://ip-api.com/json/${ip}`)}`;
            const res = await fetch(apiUrl);
            const json = await res.json();
            const data = JSON.parse(json.contents); // The actual JSON response from ip-api

            if (data.status === "success") {
                // Update dataRow with successful results
                dataRow = {
                    ip: ip,
                    isp: data.isp,
                    org: data.org,
                    country: data.country,
                    regionName: data.regionName,
                    city: data.city,
                    lat: data.lat,
                    lon: data.lon
                };

                // Insert results into the HTML table row
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
                // Handle API-level failure (e.g., rate limit hit, invalid query)
                row.innerHTML = `<td>${ip}</td><td colspan="7">Failed: ${data.message || 'Unknown Reason'}</td>`;
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            // Handle network or JSON parsing error
            row.innerHTML = `<td>${ip}</td><td colspan="7">Error: Network/Parsing Issue</td>`;
        }

        tbody.appendChild(row);
        ipLookupResults.push(dataRow); // Store result for Excel export

        // Wait 1500ms (1.5 seconds) between each request
        await delay(1500);
    }

    //alert("IP Lookup Complete!");
});

// --- Excel Export Logic ---
document.getElementById("exportBtn").addEventListener("click", () => {
    // Check if any data has been successfully looked up
    if (ipLookupResults.length === 0) {
        //--alert("No data to export. Please run a lookup first.");
        return;
    }

    // 1. Prepare the data for SheetJS (Array of Arrays format)
    const dataForExport = [
        // Headers (must match the order of data extraction)
        ["IP Address", "ISP", "Org", "Country", "Region", "City", "Latitude", "Longitude"], 
        
        // Map the stored JavaScript objects to arrays
        ...ipLookupResults.map(item => [
            item.ip,
            item.isp,
            item.org,
            item.country,
            item.regionName,
            item.city,
            item.lat,
            item.lon
        ])
    ];

    // 2. Create a new workbook and worksheet using SheetJS (XLSX)
    const ws = XLSX.utils.aoa_to_sheet(dataForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "IP Lookup Results");

    // 3. Write the workbook and trigger a download
    // The browser will prompt the user to select a save location if configured to do so.
    XLSX.writeFile(wb, "IP_Lookup_Results.xlsx");
});
