// ===== CONFIG =====
const ADMIN_PASSWORD = "roxx_gaming";
const client = window.supabase; // Use the globally available Supabase client

// Login Check
function checkAdminLogin() {
  const inputPass = document.getElementById("adminPass").value;
  if (inputPass === ADMIN_PASSWORD) {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    loadTeams();
  } else {
    document.getElementById("loginError").textContent = "Incorrect password!";
  }
}

// Load Teams from Supabase
async function loadTeams() {
  const { data, error } = await client.from("teams").select("*");

  if (error) {
    console.error("Load error:", error);
    document.getElementById("teamsTable").innerHTML = "<p style='color:red;'>Failed to fetch data</p>";
    return;
  }

  const tableHTML = `
  <div class="overflow-x-auto">
    <table class="min-w-full text-sm text-left border border-zinc-700 text-white">
      <thead class="bg-zinc-800 text-accent uppercase text-xs tracking-wider">
        <tr>
          <th class="px-4 py-3 border-b border-zinc-700">Team Name</th>
          <th class="px-4 py-3 border-b border-zinc-700">Event</th>
          <th class="px-4 py-3 border-b border-zinc-700">Email</th>
          <th class="px-4 py-3 border-b border-zinc-700">Phone</th>
          <th class="px-4 py-3 border-b border-zinc-700">Txn ID</th>
          <th class="px-4 py-3 border-b border-zinc-700">Status</th>
          <th class="px-4 py-3 border-b border-zinc-700">Members</th>
          <th class="px-4 py-3 border-b border-zinc-700">Fee</th>
          <th class="px-4 py-3 border-b border-zinc-700">Created At</th>
          <th class="px-4 py-3 border-b border-zinc-700">Slot</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-zinc-800">
        ${data.map(row => `
          <tr class="hover:bg-zinc-800/70 transition duration-150">
            <td class="px-4 py-2">${row.team_name}</td>
            <td class="px-4 py-2">${row.event_title}</td>
            <td class="px-4 py-2">${row.email}</td>
            <td class="px-4 py-2">${row.phone}</td>
            <td class="px-4 py-2">${row.txn_id}</td>
            <td class="px-4 py-2 font-semibold ${row.status === 'Paid' ? 'text-green-400' : 'text-yellow-400'}">
              ${row.status}
            </td>
            <td class="px-4 py-2">${formatMembers(row.members)}</td>
            <td class="px-4 py-2">₹${row.fee || '0'}</td>
            <td class="px-4 py-2">${new Date(row.created_at).toLocaleString()}</td>
            <td class="px-4 py-2">${row.slot_number || '-'}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
`;

  document.getElementById("teamsTable").innerHTML = tableHTML;
}

// Format members from JSON
function formatMembers(members) {
  if (!members) return '-';
  try {
    const parsed = typeof members === 'string' ? JSON.parse(members) : members;
    return parsed.map(m => `${m.name} (${m.pubg_id})`).join(', '); // Display member names with PUBG IDs
  } catch {
    return members;
  }
}

// Export to CSV
function exportToCSV() {
  client.from("teams").select("*").then(({ data, error }) => {
    if (error) {
      console.error("Export error:", error);
      alert("Failed to export data.");
      return;
    }

    const csvRows = [
      ["Team Name", "Event", "Email", "Phone", "Txn ID", "Status", "Members", "Fee", "Created At", "Slot"]
    ];

    data.forEach(row => {
      csvRows.push([
        row.team_name,
        row.event_title,
        row.email,
        row.phone,
        row.txn_id,
        row.status,
        formatMembers(row.members),
        row.fee || '0',
        new Date(row.created_at).toLocaleString(),
        row.slot_number || '-'
      ]);
    });

    const csvContent = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "teams_export.csv";
    link.click();
  });
}
