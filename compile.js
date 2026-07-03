const fs = require('fs');
const path = require('path');

// Cấu hình chi nhánh
const BRANCHES = [
  {
    sheetName: "TruSoChinh",
    id: "truso",
    name: "TRỤ SỞ CHÍNH",
    icon: "corporate_fare",
    tabLabel: "Trụ sở chính",
    phone: "0292 383 1000",
    address: "39 Đường Mậu Thân, Phường Ninh Kiều, TP. Cần Thơ",
  },
  {
    sheetName: "CN30_4",
    id: "cn304",
    name: "CHI NHÁNH 30/4",
    icon: "storefront",
    tabLabel: "Chi nhánh 30/4",
    phone: "0292 220 9000",
    address: "545 Đường 30/4, Phường Tân An, TP. Cần Thơ",
  },
  {
    sheetName: "CNOMon",
    id: "cnomon",
    name: "CHI NHÁNH Ô MÔN",
    icon: "storefront",
    tabLabel: "Chi nhánh Ô Môn",
    phone: "0292 626 6000",
    address: "21 Đường Trần Nguyên Hãn, Phường Ô Môn, TP. Cần Thơ",
  },
  {
    sheetName: "CNBinhMinh",
    id: "cnbinhminh",
    name: "CHI NHÁNH BÌNH MINH",
    icon: "storefront",
    tabLabel: "Chi nhánh Bình Minh",
    phone: "0270 655 5000",
    address: "112 Đường Lê Văn Vị, Phường Cái Vồn, Vĩnh Long",
  },
];

function getStatus(current, max) {
  if (current >= max) {
    return {
      label: "Hết slot",
      badgeClass: "bg-slate-100 text-slate-500 border border-slate-200",
      dotClass: "bg-slate-400",
      pulse: false,
    };
  } else if (current >= 16) {
    return {
      label: "Sắp hết slot",
      badgeClass: "bg-red-50 text-red-600 border border-red-100",
      dotClass: "bg-red-500",
      pulse: true,
    };
  } else {
    return {
      label: "Còn slot",
      badgeClass: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      dotClass: "bg-emerald-500",
      pulse: false,
    };
  }
}

function formatCurrency(n) {
  return Number(n).toLocaleString("vi-VN") + "đ";
}

function buildTableRows(items) {
  if (!items || !items.length) {
    return `<tr><td colspan="4" class="p-6 text-center text-slate-400 font-medium">Chưa có lớp khai giảng được cập nhật.</td></tr>`;
  }

  return items
    .map((item) => {
      const status = getStatus(item.current, item.max);
      const pulseClass = status.pulse ? " animate-[pulse_2s_ease-in-out_infinite]" : "";
      const timeLine = item.time
        ? `<div class="text-xs text-slate-400 font-semibold mt-0.5">${item.time}</div>`
        : "";

      return `
                <tr class="border-b border-slate-50 hover:bg-blue-50/30 transition-colors group">
                  <td class="p-4 pl-6">
                    <div class="font-bold text-[#002c66] group-hover:text-[#1a4a99] transition-colors">${item.name}</div>
                    ${timeLine}
                  </td>
                  <td class="p-4 font-semibold text-slate-600">${item.date}</td>
                  <td class="p-4"><span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${status.badgeClass}${pulseClass}"><span class="w-1.5 h-1.5 rounded-full ${status.dotClass}"></span> ${status.label}</span></td>
                  <td class="p-4 pr-6 font-black text-[#002c66] text-right text-[15px]">${formatCurrency(item.fee)}</td>
                </tr>`;
    })
    .join("\n");
}

function buildBranchTab(branch, isFirst, dataMap) {
  const data = dataMap[branch.sheetName] || { kids: [], adu: [] };
  const visibilityClass = isFirst ? "block" : "hidden";

  return `
        <div id="tab-${branch.id}" class="branch-content animate-fade-in ${visibilityClass}">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h2 class="font-headline font-black text-2xl text-[#002c66]">${branch.name}</h2>
            <div class="flex items-center gap-2 text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
              <span class="material-symbols-outlined text-secondary text-lg">call</span> ${branch.phone}
            </div>
          </div>
          <p class="text-slate-500 mb-6 flex items-center gap-2"><span class="material-symbols-outlined text-slate-400">location_on</span>${branch.address}</p>

          <h3 class="font-headline font-black text-xl text-slate-800 mb-4">CHƯƠNG TRÌNH KIDS & TEENS</h3>
          <div class="overflow-x-auto bg-white rounded-3xl border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] mb-8">
            <table class="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr class="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider">
                  <th class="p-4 pl-6 w-2/5">Chương trình</th>
                  <th class="p-4 w-1/5">Khai giảng</th>
                  <th class="p-4 w-1/5">Tình trạng</th>
                  <th class="p-4 pr-6 w-1/5 text-right">Học phí</th>
                </tr>
              </thead>
              <tbody class="text-slate-700 font-medium text-sm">
${buildTableRows(data.kids)}
              </tbody>
            </table>
          </div>

          <h3 class="font-headline font-black text-xl text-slate-800 mb-4">CHƯƠNG TRÌNH NGƯỜI LỚN - ADU / IELTS</h3>
          <div class="overflow-x-auto bg-white rounded-3xl border border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] mb-8">
            <table class="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr class="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider">
                  <th class="p-4 pl-6 w-2/5">Chương trình</th>
                  <th class="p-4 w-1/5">Khai giảng</th>
                  <th class="p-4 w-1/5">Tình trạng</th>
                  <th class="p-4 pr-6 w-1/5 text-right">Học phí</th>
                </tr>
              </thead>
              <tbody class="text-slate-700 font-medium text-sm">
${buildTableRows(data.adu)}
              </tbody>
            </table>
          </div>
        </div>`;
}

function buildTabButtons() {
  return BRANCHES.map((branch, idx) => {
    const activeClass = idx === 0 ? " active" : "";
    return `        <button onclick="switchBranch('${branch.id}')" id="btn-${branch.id}" class="branch-tab${activeClass} bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
          <span class="material-symbols-outlined text-xl">${branch.icon}</span>
          ${branch.tabLabel}
        </button>`;
  }).join("\n");
}

function compile() {
  const baseDir = __dirname;
  const templatePath = path.join(baseDir, 'Template.html');
  const dataPath = path.join(baseDir, 'data.json');
  const indexOutputPath = path.join(baseDir, 'index.html');
  const scheduleOutputPath = path.join(baseDir, 'lich-khai-giang.html');

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template.html not found at ${templatePath}`);
  }
  if (!fs.existsSync(dataPath)) {
    throw new Error(`data.json not found at ${dataPath}`);
  }

  let templateContent = fs.readFileSync(templatePath, 'utf8');
  const dataContent = fs.readFileSync(dataPath, 'utf8');
  const dataMap = JSON.parse(dataContent);

  const tabButtons = buildTabButtons();
  const tabContents = BRANCHES.map((b, idx) => buildBranchTab(b, idx === 0, dataMap)).join("\n");

  templateContent = templateContent.replace('<?!= tabButtons ?>', tabButtons);
  templateContent = templateContent.replace('<?!= tabContents ?>', tabContents);

  fs.writeFileSync(indexOutputPath, templateContent, 'utf8');
  fs.writeFileSync(scheduleOutputPath, templateContent, 'utf8');
  console.log(`Successfully compiled HTML from data.json to index.html and lich-khai-giang.html`);
  return true;
}

// Cho phép chạy trực tiếp bằng command `node compile.js` hoặc import/require từ server.js
if (require.main === module) {
  compile();
}

module.exports = {
  compile,
  BRANCHES
};
