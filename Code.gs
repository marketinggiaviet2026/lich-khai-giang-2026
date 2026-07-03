/**
 * ============================================================
 *  GIA VIỆT - GENERATE LANDING PAGE LỊCH KHAI GIẢNG TỪ SHEET
 * ============================================================
 *  Cách dùng:
 *  1. Tạo Google Sheet mới, đặt tên tuỳ ý (vd: "Lich Khai Giang")
 *  2. Vào Extensions > Apps Script, xoá hết code mặc định,
 *     dán toàn bộ nội dung file Code.gs này vào.
 *  3. Tạo thêm 1 file HTML trong Apps Script tên "Template"
 *     và dán nội dung file Template.html (gửi kèm) vào đó.
 *  4. Lưu lại, bấm Reload trang Sheet (F5).
 *  5. Sẽ thấy menu mới "🎓 Gia Việt" trên thanh menu Sheet.
 *  6. Nhập dữ liệu lớp học vào các sheet con (xem CAU_TRUC_SHEET()
 *     bên dưới để tự tạo cấu trúc mẫu).
 *  7. Vào menu "🎓 Gia Việt" > "Tạo file HTML lịch khai giảng"
 *     -> sẽ xuất ra link Google Drive chứa file HTML hoàn chỉnh,
 *     tải về và upload lên Vercel (thay file lich-khai-giang.html cũ).
 * ============================================================
 */

// ---------- CẤU HÌNH CHI NHÁNH (sửa ở đây nếu cần) ----------
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

// Cột trong mỗi sheet chi nhánh, theo đúng thứ tự:
// A: Nhóm chương trình (KIDS / ADU)  -> dùng để tách 2 bảng
// B: Tên lớp
// C: Giờ học
// D: Ngày khai giảng (dd/mm/yyyy)
// E: Sĩ số hiện tại
// F: Sĩ số tối đa
// G: Học phí (số, vd 2500000)

const HEADER_ROW = 1;
const FIRST_DATA_ROW = 2;

// ---------- NGƯỠNG TÍNH TRẠNG THÁI SLOT ----------
function getStatus(current, max) {
  const ratio = current; // dùng số tuyệt đối theo quy ước đã chốt: 0-15 / 16-21 / 22
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

// ---------- MENU ----------
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🎓 Gia Việt")
    .addItem("Tạo file HTML lịch khai giảng", "generateHTML")
    .addItem("Khởi tạo cấu trúc sheet mẫu (chỉ chạy 1 lần)", "setupSheets")
    .addToUi();
}

// ---------- KHỞI TẠO SHEET MẪU ----------
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const headers = ["Nhóm (KIDS/ADU)", "Tên lớp", "Giờ học", "Ngày khai giảng", "Sĩ số hiện tại", "Sĩ số tối đa", "Học phí"];

  BRANCHES.forEach((branch) => {
    let sheet = ss.getSheetByName(branch.sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(branch.sheetName);
    }
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#002c66")
      .setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, headers.length, 150);
    sheet.getRange(2, 1, 1, 1).setValue("KIDS");
    sheet.getRange(2, 2, 1, 1).setValue("VD: Family & Friends 1A");
    sheet.getRange(2, 3, 1, 1).setValue("17:45 - 19:15");
    sheet.getRange(2, 4, 1, 1).setValue("13/07/2026");
    sheet.getRange(2, 5, 1, 1).setValue(5);
    sheet.getRange(2, 6, 1, 1).setValue(22);
    sheet.getRange(2, 7, 1, 1).setValue(2500000);

    // Data validation cho cột Nhóm
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["KIDS", "ADU"], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, 1, 500, 1).setDataValidation(rule);
  });

  SpreadsheetApp.getUi().alert(
    "Đã tạo xong 4 sheet chi nhánh (TruSoChinh, CN30_4, CNOMon, CNBinhMinh).\n\n" +
    "Mỗi sheet có 1 dòng mẫu ở dòng 2 — em xoá dòng mẫu rồi nhập dữ liệu thật vào từ dòng 2 nhé.\n\n" +
    "Cột A chọn KIDS (cho Kids & Teens) hoặc ADU (cho người lớn/IELTS)."
  );
}

// ---------- ĐỌC DỮ LIỆU TỪ 1 SHEET CHI NHÁNH ----------
function readBranchData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { kids: [], adu: [] };

  const lastRow = sheet.getLastRow();
  if (lastRow < FIRST_DATA_ROW) return { kids: [], adu: [] };

  const values = sheet.getRange(FIRST_DATA_ROW, 1, lastRow - FIRST_DATA_ROW + 1, 7).getValues();
  const kids = [];
  const adu = [];

  values.forEach((row) => {
    const [group, name, time, date, current, max, fee] = row;
    if (!name) return; // bỏ dòng trống

    let dateStr = date;
    if (date instanceof Date) {
      dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy");
    }

    const item = {
      name: String(name).trim(),
      time: String(time || "").trim(),
      date: dateStr,
      current: Number(current) || 0,
      max: Number(max) || 22,
      fee: Number(fee) || 0,
    };

    if (String(group).trim().toUpperCase() === "ADU") {
      adu.push(item);
    } else {
      kids.push(item);
    }
  });

  return { kids, adu };
}

// ---------- BUILD HTML CHO 1 BẢNG (KIDS hoặc ADU) ----------
function buildTableRows(items) {
  if (!items.length) {
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

// ---------- BUILD 1 TAB CHI NHÁNH ----------
function buildBranchTab(branch, isFirst) {
  const data = readBranchData(branch.sheetName);
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

// ---------- BUILD CÁC NÚT TAB ----------
function buildTabButtons() {
  return BRANCHES.map((branch, idx) => {
    const activeClass = idx === 0 ? " active" : "";
    return `        <button onclick="switchBranch('${branch.id}')" id="btn-${branch.id}" class="branch-tab${activeClass} bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
          <span class="material-symbols-outlined text-xl">${branch.icon}</span>
          ${branch.tabLabel}
        </button>`;
  }).join("\n");
}

// ---------- HÀM CHÍNH: GENERATE FILE HTML ----------
function generateHTML() {
  const ui = SpreadsheetApp.getUi();

  const tabButtons = buildTabButtons();
  const tabContents = BRANCHES.map((b, idx) => buildBranchTab(b, idx === 0)).join("\n");
  const branchIdsJs = BRANCHES.map((b) => `'${b.id}'`).join(", ");

  const template = HtmlService.createTemplateFromFile("Template");
  template.tabButtons = tabButtons;
  template.tabContents = tabContents;
  template.branchIdsJs = branchIdsJs;

  const htmlOutput = template.evaluate().getContent();

  // Lưu file vào Google Drive (My Drive > Gia Viet Landing Pages)
  const folderName = "Gia Viet Landing Pages";
  const folders = DriveApp.getFoldersByName(folderName);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

  const fileName = "lich-khai-giang.html";
  const existing = folder.getFilesByName(fileName);
  while (existing.hasNext()) {
    existing.next().setTrashed(true);
  }
  const file = folder.createFile(fileName, htmlOutput, MimeType.HTML);

  ui.alert(
    "✅ Đã tạo xong file HTML!\n\n" +
    "Tên file: " + fileName + "\n" +
    "Vị trí: Google Drive > " + folderName + "\n\n" +
    "Link tải: " + file.getUrl() + "\n\n" +
    "Em vào Drive, tải file .html này về máy, rồi upload thay thế file lich-khai-giang.html cũ trên Vercel (qua GitHub hoặc Vercel CLI/drag-drop)."
  );
}

// Hỗ trợ include (không bắt buộc nếu Template.html là 1 file đơn)
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
