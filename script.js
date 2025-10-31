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

// Get buttons and table body elements
const lookupBtn = document.getElementById("lookupBtn");
const exportBtn = document.getElementById("exportBtn");
const tbody = document.querySelector("#resultTable tbody");

// --- IP Lookup Logic ---
lookupBtn.addEventListener("click", async () => {
    // 1. Setup: Get and sanitize input
    const input = document.getElementById("ipInput").value.trim();
    const ips = input.split("\n").map(ip => ip.trim()).filter(ip => ip);

    // Initial checks and state setup
    if (ips.length === 0) {
        alert("Please enter at least one IP address.");
        return;
    }
    
    tbody.innerHTML = ""; // Clear existing table rows
    ipLookupResults = []; // Clear previous results for the new run
    
    // Disable button and show loading state for better user feedback
    lookupBtn.disabled = true;
    lookupBtn.textContent = "Looking up... (Please Wait)";

    // 2. Loop through each IP
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
            const apiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`http://ip-api.com/json/${ip}`)}`;
            const res = await fetch(apiUrl);
            
            // 2a. Check for non-200 HTTP response (Network/Proxy issue)
            if (!res.ok) {
                throw new Error(`HTTP Error! Status: ${res.status}`);
            }

            const json = await res.json();
            
            let data;
            
            // 2b. Check for JSON Parsing issue on the content (robustness enhancement)
            try {
                // The actual JSON response from ip-api is inside the proxy's 'contents' field
                data = JSON.parse(json.contents); 
            } catch (parseErr) {
                console.error("JSON Parsing Error for IP:", ip, parseErr);
                row.classList.add('table-danger');
                // Displaying part of the raw content helps in debugging
                row.innerHTML = `<td>${ip}</td><td colspan="7">Error: Parsing failed. Raw: ${String(json.contents).substring(0, 50)}...</td>`;
                
                // Finalize this row and continue to the next IP
                tbody.appendChild(row);
                ipLookupResults.push(dataRow); 
                await delay(1500);
                continue; 
            }
            
            // 2c. Handle ip-api.com failure (API-level message, e.g., rate limit, invalid IP format)
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
                    <td>${ip}</td><td>${data.isp}</td><td>${data.org}</td>
                    <td>${data.country}</td><td>${data.regionName}</td><td>${data.city}</td>
                    <td>${data.lat}</td><td>${data.lon}</td>
                `;
            } else {
                row.classList.add('table-warning'); // Highlight failed rows
                row.innerHTML = `<td>${ip}</td><td colspan="7">Failed: ${data.message || 'Unknown Reason'}</td>`;
            }
            
        } catch (err) {
            // Catches general network failure (e.g., DNS, connection refused) or the HTTP error we threw
            console.error("Network/General Fetch Error:", err);
            row.classList.add('table-danger');
            row.innerHTML = `<td>${ip}</td><td colspan="7">Error: Network Issue (${err.message || 'Connection Failed'}).</td>`;
        }

        tbody.appendChild(row);
        ipLookupResults.push(dataRow); // Store result for Excel export

        // Wait 1500ms (1.5 seconds) between each request for rate limit management
        await delay(1000);
    }

    // 3. Cleanup: Reset button state
    lookupBtn.disabled = false;
    lookupBtn.textContent = "Lookup IPs";
});

// --- Excel Export Logic ---
document.getElementById("exportBtn").addEventListener("click", () => {
    // Check if any data has been successfully looked up
    if (ipLookupResults.length === 0) {
        alert("No data to export. Please run a lookup first.");
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
    XLSX.writeFile(wb, "IP_Lookup_Results.xlsx");
});
