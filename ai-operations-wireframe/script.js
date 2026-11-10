"use strict";

const icons = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8l10-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  file: '<path d="M14 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9l-7-7Z"/><path d="M14 2v7h7M7 14h10M7 18h6"/>',
  history: '<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  refresh: '<path d="M20 7a8 8 0 0 0-13-2L3 9m0-6v6h6M4 17a8 8 0 0 0 13 2l4-4m0 6v-6h-6"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="m12 3 10 18H2L12 3Zm0 6v5m0 3v1"/>',
  check: '<path d="m5 12 4 4L19 6"/>'
};
const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[name] || icons.file) + '</svg>';
const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));
const types = [
  {id:"short-word", name:"Short Answer Word Count"},
  {id:"listing", name:"Listing"},
  {id:"long", name:"Long Answer"},
  {id:"practice", name:"AI Practice"},
  {id:"forum", name:"Class Forum"},
  {id:"mock-speaking", name:"Mock Test Speaking"},
  {id:"mock-writing", name:"Mock Test Writing"},
  {id:"vstep-speaking", name:"VSTEP Speaking"},
  {id:"vstep-writing", name:"VSTEP Writing"},
  {id:"pt-speaking", name:"PT Speaking"},
  {id:"pt-writing", name:"PT Writing"},
  {id:"hskk", name:"HSKK", planned:"Đang phát triển"},
  {id:"short-speaking", name:"Short Answer Speaking", planned:"Đang BA"},
  {id:"short-writing", name:"Short Answer Writing", planned:"Đang BA"}
];
const rootCauses = [
  {id:"config", name:"Cấu hình LCMS", description:"Không tìm thấy cấu hình chấm theo phiên bản học liệu.", color:"error"},
  {id:"release", name:"Phần mềm / bản phát hành", description:"Phản hồi chấm không được xử lý đúng cấu trúc dự kiến.", color:"error"},
  {id:"provider", name:"Dịch vụ bên thứ ba", description:"Azure Speech và OpenAI trả lỗi hoặc phản hồi chậm.", color:"warning"},
  {id:"device", name:"Thiết bị & tệp đầu vào", description:"Lỗi thu âm, chuyển đổi file hoặc Browser STT.", color:"neutral"}
];
const languages = ["Tiếng Anh","Tiếng Việt","Tiếng Nhật","Tiếng Trung","Tiếng Hàn"];
const platforms = ["Web · Chrome","iOS · App","Android · App"];
const baseTime = Date.UTC(2026,10,5,7,32,0);
const state = {
  view:"overview", role:"tech", scenario:"normal", query:"", school:"", type:"", language:"", status:"",
  cause:"", location:"", offset:0, current:null, detailTab:"journey", deleted:new Set(), lastUpdated:baseTime,
  started:Date.now(), toastTimer:null
};
let auditEvents = [];

function buildRows() {
  const rows = [];
  const runningTypes = types.filter(type => !type.planned);
  for (let index = 0; index < 33; index++) {
    const type = runningTypes[index % runningTypes.length];
    const speaking = type.id.includes("speaking") || type.id === "forum";
    const row = {
      id:"AI-" + String(2401 + index), root:"NOP-" + String(1701 + index),
      student:"SV-" + String(101 + Math.floor(index / 2)), type:type.id, typeName:type.name,
      school:["Đơn vị mẫu A","Đơn vị mẫu B","Đơn vị mẫu C"][Math.floor(index / 11)],
      language:languages[index % languages.length], platform:platforms[index % platforms.length],
      course:["English B1","Tiếng Việt thực hành","日本語 N4","中文 HSK 3","한국어 2"][index % 5],
      position:"Unit " + (index % 4 + 1) + " / Lesson " + (index % 6 + 1),
      question:"Q-" + String(310 + index), status:"success", cause:"", stage:"Lưu kết quả & cập nhật điểm",
      provider:"OpenAI", error:"", age:18 + index, duration:12 + index % 13, requests:1 + (speaking ? 2 : 0),
      submitted:true, speaking, grade:"4,0 / 5", lesson:"Đã đồng bộ", published:"Chưa đăng",
      version:"v" + (index % 3 + 5), config:"CFG-" + (700 + index), configVersion:"v3",
      build:"course-lms 2026.11.05-demo", transcript:speaking ? "I would like to describe a place where I often study." : "",
      original:"Bài làm mô phỏng phục vụ review màn giám sát AI.", attempt:index % 2 + 1
    };
    if (index < 5) {
      Object.assign(row, {type:"forum",typeName:"Class Forum",school:"Đơn vị mẫu A",language:"Tiếng Anh",
        course:"English B1",position:"Unit 3 / Lesson 2",question:"CF-007",status:"error",cause:"config",
        stage:"Tìm cấu hình LCMS",error:"ConfigErrorOccurred",provider:"Nội bộ FSEL",requests:0,
        grade:"Chưa có",lesson:"Đang chờ",duration:1,age:110 + index * 12,version:"v7",config:"Chưa resolve",speaking:true});
    } else if (index < 9) {
      Object.assign(row, {type:index === 8 ? "long" : "listing",typeName:index === 8 ? "Long Answer" : "Listing",
        language:"Tiếng Anh",school:"Đơn vị mẫu A",course:"English B1",position:"Unit 2 / Lesson 4",
        question:index === 8 ? "LA-014" : "LIST-012",status:index === 6 ? "fallback" : "error",
        cause:"release",stage:"Kiểm tra kết quả chấm",error:"InvalidGradingResponse",requests:2,
        grade:index === 6 ? "5,0 / 5 · Dự phòng" : "Chưa có",lesson:index === 6 ? "Đã đồng bộ" : "Đang chờ",
        age:98 + index, duration:42, speaking:false});
    } else if (index < 12) {
      Object.assign(row, {status:"error",cause:"provider",provider:index === 11 ? "OpenAI" : "Azure Speech",
        stage:index === 11 ? "Chấm nội dung" : "Azure STT",error:index === 11 ? "HTTP 503" : "HTTP 429",
        requests:3,grade:"Chưa có",lesson:"Đang chờ",age:95 + index,duration:35,speaking:true});
    } else if (index < 16) {
      Object.assign(row, {status:"waiting",cause:"provider",provider:index % 2 ? "OpenAI" : "Azure Speech",
        stage:index % 2 ? "Chấm nội dung" : "Azure STT",age:[64,43,22,12][index - 12],
        requests:1,grade:index === 13 ? "Nội dung 3,5 / 5" : "Chưa có",lesson:"Đang chờ"});
    } else if (index < 18) {
      Object.assign(row, {status:"client",cause:"device",stage:index === 16 ? "Convert WAV" : "Browser STT",
        error:index === 16 ? "AudioConversionFailed" : "not-allowed",provider:"Thiết bị",submitted:false,
        requests:0,grade:"Chưa có",lesson:"Chưa nhận bài",age:70,root:"PHIEN-" + (400 + index),speaking:true});
    }
    if (row.type.includes("mock-") || row.type.includes("vstep-") || row.type.includes("pt-")) {
      const exam = row.type.startsWith("mock-") ? "Mock Test" : row.type.startsWith("vstep-") ? "VSTEP" : "Placement Test";
      row.position = exam + " · Đề mẫu 01 / " + (row.type.endsWith("speaking") ? "Speaking" : "Writing");
    }
    rows.push(row);
  }
  // Two AI units in a test can share one submitted test attempt.
  for (const [first,second] of [[18,19],[20,21],[27,28],[29,30],[31,32]]) {
    const source = rows[first];
    for (const key of ["root","student","language","school","course","platform","attempt"]) rows[second][key] = source[key];
  }
  for (const extra of [
    {id:"AI-2434",stage:"Tải file lên server",error:"NetworkDisconnected",provider:"Thiết bị",question:"CF-008"},
    {id:"AI-2435",stage:"Kiểm tra file",error:"InvalidAudioFile",provider:"Thiết bị",question:"CF-009"},
    {id:"AI-2436",stage:"Azure STT",error:"STTNoResult",provider:"Azure Speech",question:"CF-010"}
  ]) rows.push({...rows[16],...extra,root:"PHIEN-"+extra.id,course:"English B1",position:"Unit 3 / Lesson 2",language:"Tiếng Anh",type:"forum",typeName:"Class Forum",school:"Đơn vị mẫu A",status:"client",submitted:false,grade:"Chưa có",lesson:"Chưa nhận bài",requests:extra.error==="STTNoResult"?1:0});
  return rows;
}
const rows = buildRows();

function resetAudit() {
  auditEvents = [
    {time:baseTime - 240000,actor:"Admin tổng",action:"Cấp quyền xem dữ liệu AI",target:"Vai trò Tech vận hành",reason:"Phê duyệt truy cập theo vai trò · mô phỏng",result:"Đã cấp"},
    {time:baseTime - 180000,actor:"Admin tổng",action:"Cấp quyền xem dữ liệu AI",target:"Vai trò Academic",reason:"Phê duyệt truy cập theo vai trò · mô phỏng",result:"Đã cấp"}
  ];
}
function timeLabel(timestamp) {
  return new Intl.DateTimeFormat("vi-VN",{timeZone:"Asia/Ho_Chi_Minh",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(timestamp);
}
function clockTime() {
  return baseTime + state.offset * 1000;
}
function elapsed(row) {
  return row.age + state.offset;
}
function isOverdue(row) {
  return row.status === "waiting" && elapsed(row) > 30;
}
function hasProblem(row) {
  return row.status === "error" || row.status === "fallback" || row.status === "client" || isOverdue(row);
}
function badge(text, tone="neutral") {
  return '<span class="badge ' + tone + '"><span class="badge-dot"></span>' + escapeHtml(text) + '</span>';
}
function statusBadge(row) {
  if (row.status === "error") return badge("AI lỗi","error");
  if (row.status === "fallback") return badge("AI lỗi · Có điểm dự phòng","warning");
  if (row.status === "client") return badge("Lỗi trước nộp","neutral");
  if (isOverdue(row)) return badge("Quá 30 giây","warning");
  if (row.status === "waiting") return badge("Đang xử lý","brand");
  return badge("AI hoàn tất","success");
}
function matchesStatus(row, value) {
  if (value === "error") return row.status === "error" || row.status === "fallback";
  if (value === "overdue") return isOverdue(row);
  if (value === "fallback") return row.status === "fallback";
  return !value || row.status === value;
}
function filteredRows() {
  const query = state.query.trim().toLocaleLowerCase("vi");
  return rows.filter(row => {
    const text = [row.id,row.root,row.student,row.course,row.position,row.question,row.error].join(" ").toLocaleLowerCase("vi");
    return !state.deleted.has(row.id) && (!query || text.includes(query)) &&
      (!state.school || row.school === state.school) && (!state.type || row.type === state.type) &&
      (!state.language || row.language === state.language) && matchesStatus(row,state.status) &&
      (!state.cause || row.cause === state.cause) && (!state.location || locationKey(row) === state.location);
  });
}
function locationKey(row) {
  return [row.school,row.course,row.position,row.question].join("|");
}
function metricMarkup(data) {
  const submitted = data.filter(row => row.submitted);
  const uniqueRoots = new Set(submitted.map(row => row.root)).size;
  const failed = submitted.filter(row => ["error","fallback"].includes(row.status)).length;
  const cards = [
    {label:"Bài nộp thành công",value:uniqueRoots,foot:"Lượt nộp duy nhất",key:"",tone:"",symbol:"↗"},
    {label:"Đơn vị xử lý AI",value:submitted.length,foot:"Câu / phần cần AI",key:"",tone:"",symbol:"◇"},
    {label:"AI lỗi",value:failed,foot:"Gồm điểm dự phòng",key:"error",tone:"danger",symbol:"!"},
    {label:"Đang chờ quá 30s",value:submitted.filter(isOverdue).length,foot:"Tech cần theo dõi",key:"overdue",tone:"warning",symbol:"◷"},
    {label:"Có điểm dự phòng",value:submitted.filter(row => row.status === "fallback").length,foot:"AI chưa chấm thành công",key:"fallback",tone:"warning",symbol:"↪"},
    {label:"AI hoàn tất",value:submitted.filter(row => row.status === "success").length,foot:"Kết quả đã lưu",key:"success",tone:"success",symbol:"✓"}
  ];
  return '<section class="metrics" aria-label="Chỉ số trong phạm vi lọc">' + cards.map(card =>
    '<button class="metric ' + card.tone + (state.status && state.status === card.key ? " selected" : "") + '" data-metric="' + card.key + '" aria-label="' + escapeHtml(card.label) + ': ' + card.value + '">' +
    '<span class="metric-label">' + card.label + '</span><span class="metric-corner" aria-hidden="true">' + card.symbol + '</span><span class="metric-value">' + card.value +
    '</span><span class="metric-foot">' + card.foot + '</span></button>').join("") + '</section>';
}
function issueCards(data) {
  return rootCauses.map(cause => {
    const affected = data.filter(row => row.cause === cause.id && hasProblem(row));
    if (!affected.length) return "";
    const exemplar = affected[0];
    return '<button class="issue-card" data-cause="' + cause.id + '"><div class="issue-top">' + badge(affected.length + " đơn vị",cause.color) +
      '<span class="issue-title">' + cause.name + '</span></div><p class="issue-meta">' + cause.description +
      '</p><div class="issue-bottom"><span class="tag-code">' + escapeHtml(exemplar.error || "ProcessingTimeout") +
      '</span><span>· Cần Tech xác minh</span><span class="issue-arrow" aria-hidden="true">→</span></div></button>';
  }).join("");
}
function renderOverview(data) {
  const countMax = Math.max(...types.map(type => data.filter(row => row.type === type.id && row.submitted).length),1);
  const typeRows = types.map(type => {
    const subset = data.filter(row => row.type === type.id && row.submitted);
    const problems = subset.filter(hasProblem).length;
    if (type.planned) return '<div class="type-row planned"><span class="type-name">' + type.name +
      '</span><span class="type-value">—</span><span class="type-note">' + type.planned + ' · Chưa tích hợp log</span></div>';
    return '<button class="type-row" data-type="' + type.id + '"><span class="type-name">' + type.name +
      '</span><span class="type-value">' + subset.length + '</span><span class="type-note">' +
      (problems ? problems + " đang gặp vấn đề" : "Đơn vị AI đã ghi nhận") + '</span><span class="type-bar"><span style="width:' +
      Math.round(subset.length / countMax * 100) + '%"></span></span></button>';
  }).join("");
  const preSubmit = data.filter(row => !row.submitted).length;
  return metricMarkup(data) +
    '<div class="dashboard-grid"><section class="panel"><div class="panel-header"><div><h2>Nhóm vấn đề cần theo dõi</h2><p>Gom bài ảnh hưởng để xác định nguyên nhân</p></div><span class="count-label">Trong phạm vi lọc</span></div><div class="issue-list">' +
    (issueCards(data) || '<p class="muted small" style="padding:24px 0">Chưa ghi nhận vấn đề trong phạm vi lọc.</p>') +
    '</div><div class="panel-footer">Phân loại nguyên nhân là nhận định cần được Tech xác minh.</div></section>' +
    '<section class="panel"><div class="panel-header"><div><h2>Phân bổ theo loại bài</h2><p>Đơn vị xử lý AI · Bấm để xem bài ảnh hưởng</p></div><span class="count-label">14 loại</span></div><div class="type-list">' + typeRows +
    '</div><div class="panel-footer">HSKK và hai dạng Short Answer mới được giữ trong danh mục theo dõi.</div></section></div>' +
    '<div class="coverage-strip">' + icon("file") + '<span><b>' + preSubmit + ' sự kiện lỗi trước nộp</b> · Được ghi nhận riêng từ thiết bị, convert file và Browser STT.</span>' +
    (preSubmit ? '<button class="button text" data-status="client">Xem sự kiện →</button>' : "") + '</div>' +
    '<section class="panel wide-panel"><div class="panel-header"><div><h2>Bài làm cần chú ý</h2><p>Từ nhóm vấn đề đến từng lần xử lý</p></div><button class="button text" data-view="submissions">Xem tất cả →</button></div>' +
    submissionTable(data.filter(hasProblem).slice(0,6)) + '</section>';
}
function submissionTable(data) {
  if (!data.length) return '<div class="table-note">Chưa có bài phù hợp trong phạm vi này.</div>';
  return '<div class="table-scroll"><table><thead><tr><th>Bài / đơn vị AI</th><th>Vị trí học liệu</th><th>Bước đang theo dõi</th><th>Trạng thái AI</th><th>Điểm / Lesson</th><th></th></tr></thead><tbody>' +
    data.map(row => '<tr><td><button class="table-link" data-detail="' + row.id + '">' + row.id + '</button><small>' + row.typeName +
      ' · ' + row.language + '</small><small>' + escapeHtml(row.student) + ' · Lần ' + row.attempt + '</small></td><td class="cell-path"><strong>' +
      escapeHtml(row.course) + '</strong><small>' + escapeHtml(row.position) + ' · ' + escapeHtml(row.question) +
      '</small><small>' + row.school + '</small></td><td class="cell-error"><strong>' + row.stage + '</strong><small>' + row.provider +
      ' · ' + (row.status === "waiting" ? elapsed(row) + "s từ khi nộp" : row.duration + "s xử lý") +
      '</small>' + (row.error ? '<span class="tag-code">' + row.error + '</span>' : "") + '</td><td>' + statusBadge(row) +
      '</td><td><strong>' + row.grade + '</strong><small>Lesson · ' + row.lesson +
      '</small></td><td><button class="icon-button" data-detail="' + row.id + '" aria-label="Xem chi tiết ' + row.id + '">→</button></td></tr>').join("") +
    '</tbody></table></div>';
}
function renderSubmissions(data) {
  const selectedType = types.find(type => type.id === state.type);
  if (!data.length && selectedType?.planned) return emptyMarkup(selectedType.name + " · " + selectedType.planned,"Loại bài được giữ trong phạm vi theo dõi. Chưa tích hợp sự kiện trong dữ liệu mẫu.","clear");
  if (!data.length) return emptyMarkup("Không tìm thấy bài phù hợp","Thử thay đổi từ khóa hoặc bỏ bớt điều kiện lọc.","clear");
  return '<section class="panel"><div class="panel-header"><div><h2>Bài làm & từng lần xử lý AI</h2><p>' +
    data.length + ' bản ghi theo dõi · ' + data.filter(row => !row.submitted).length +
    ' sự kiện trước nộp</p></div><span class="count-label">Mỗi dòng · một đơn vị xử lý</span></div>' +
    submissionTable(data) + '<div class="table-note">“Bài nộp thành công” và trạng thái AI được theo dõi riêng. Điểm dự phòng có nhãn để Academic kiểm tra.</div></section>';
}
function renderLocations(data) {
  const groups = new Map();
  data.filter(hasProblem).forEach(row => {
    const key = locationKey(row);
    if (!groups.has(key)) groups.set(key,{row,items:[]});
    groups.get(key).items.push(row);
  });
  const entries = [...groups.entries()];
  if (!entries.length) return emptyMarkup("Chưa có vị trí gặp vấn đề","Các vị trí có bài lỗi hoặc chờ quá 30 giây sẽ xuất hiện tại đây.","clear");
  return '<section class="panel"><div class="panel-header"><div><h2>Vị trí gặp vấn đề</h2><p>Truy xuống khóa học, bài học và câu hỏi cụ thể</p></div><span class="count-label">' +
    entries.length + ' vị trí</span></div><div class="table-scroll"><table><thead><tr><th>Đơn vị / vị trí</th><th>Loại bài & bước xử lý</th><th>Đơn vị ảnh hưởng</th><th>Cấu hình / phần mềm</th><th></th></tr></thead><tbody>' +
    entries.map(([key,group]) => {
      const row = group.row;
      return '<tr><td class="cell-path"><strong>' + row.school + ' / ' + row.course + '</strong><small>' +
        row.position + ' / ' + row.question + ' · ' + row.version + '</small></td><td><strong>' + row.typeName +
        '</strong><small>' + row.stage + '</small><span class="tag-code">' + escapeHtml(row.error || "ProcessingTimeout") +
        '</span></td><td>' + badge(group.items.length + " đơn vị",row.cause === "config" || row.cause === "release" ? "error" : "warning") +
        '<small>' + new Set(group.items.filter(item => item.submitted).map(item => item.root)).size +
        ' lượt nộp đã nhận</small></td><td><strong>' + row.config + '</strong><small>' + row.build +
        '</small></td><td><button class="button text" data-location="' + escapeHtml(key) + '">Xem bài →</button></td></tr>';
    }).join("") + '</tbody></table></div><div class="table-note">Nhóm theo vị trí và phiên bản giúp khoanh vùng các bài cùng chịu ảnh hưởng.</div></section>';
}
function renderAudit() {
  return '<section class="panel"><div class="panel-header"><div><h2>Audit Log quản trị</h2><p>Lịch sử cấp quyền và thao tác trên dữ liệu theo dõi</p></div><span class="count-label">' + auditEvents.length +
    ' sự kiện</span></div><div class="table-scroll"><table><thead><tr><th>Thời điểm</th><th>Người thực hiện</th><th>Thao tác / đối tượng</th><th>Lý do</th><th>Kết quả</th></tr></thead><tbody>' +
    [...auditEvents].reverse().map(event => '<tr><td class="nowrap">' + timeLabel(event.time) + '<small>05/11/2026</small></td><td>' + event.actor +
      '</td><td><strong>' + event.action + '</strong><small>' + event.target + '</small></td><td>' + escapeHtml(event.reason) +
      '</td><td>' + badge(event.result,"neutral") + '</td></tr>').join("") +
    '</tbody></table></div><div class="table-note">Sự kiện trong wireframe là dữ liệu mô phỏng. Quyền truy cập được Admin tổng phê duyệt theo quyết định Q8.</div></section>';
}
function emptyMarkup(title,description,action) {
  return '<div class="empty-state"><div class="empty-symbol">' + icon("search") + '</div><h2>' + title +
    '</h2><p>' + description + '</p>' + (action === "clear" ? '<button class="button secondary" data-clear="true">Bỏ bộ lọc</button>' : "") + '</div>';
}
function renderState(data) {
  if (state.scenario === "denied") return emptyMarkup("Bạn cần quyền truy cập giám sát AI","Liên hệ Admin tổng để được phê duyệt quyền theo vai trò.");
  if (state.scenario === "loading") return '<div role="status" aria-label="Đang tải dữ liệu"><div class="metrics">' +
    Array.from({length:6},()=>'<div class="skeleton-card"><div class="skeleton-line" style="width:65%"></div><div class="skeleton-line" style="height:25px;width:40%"></div></div>').join("") +
    '</div><div class="skeleton-block"></div><p class="muted small" style="padding:16px 0">Đang tải số liệu giám sát…</p></div>';
  if (state.scenario === "empty") return emptyMarkup("Chưa ghi nhận dữ liệu AI","Dữ liệu sẽ xuất hiện khi các luồng AI gửi sự kiện trong khoảng thời gian đang theo dõi.");
  let markup;
  if (state.view === "overview") markup = renderOverview(data);
  else if (state.view === "locations") markup = renderLocations(data);
  else if (state.view === "submissions") markup = renderSubmissions(data);
  else if (managementViews.includes(state.view)) markup = renderManagement();
  else markup = renderAudit();
  if (state.scenario === "offline") markup = '<div class="offline-banner">' + icon("alert") +
    '<div><b>Đang mất kết nối cập nhật</b><p>Đang hiển thị bản dữ liệu gần nhất. Thời điểm cập nhật được giữ lại để kiểm tra độ mới.</p></div></div>' + markup;
  return markup;
}
function activeFilterMarkup() {
  const filters = [];
  if (state.cause) filters.push({key:"cause",label:"Nhóm lỗi · " + rootCauses.find(cause => cause.id === state.cause).name});
  if (state.location) filters.push({key:"location",label:"Vị trí · " + state.location.split("|").slice(1).join(" / ")});
  if (state.type) filters.push({key:"type",label:types.find(type => type.id === state.type).name});
  if (state.status) filters.push({key:"status",label:$("#status-filter").selectedOptions[0].textContent});
  if (state.school) filters.push({key:"school",label:state.school});
  if (state.language) filters.push({key:"language",label:state.language});
  if (state.query) filters.push({key:"query",label:"Tìm · " + state.query});
  const area = $("#active-filters");
  area.hidden = !filters.length;
  area.innerHTML = filters.map(filter => '<span class="filter-chip">' + escapeHtml(filter.label) +
    '<button data-remove-filter="' + filter.key + '" aria-label="Bỏ bộ lọc ' + escapeHtml(filter.label) + '">×</button></span>').join("") +
    '<button class="reset-filters" data-clear="true">Bỏ tất cả</button>';
}
function render() {
  const labels = {overview:["Giám sát vận hành AI","Tổng quan AI","Theo dõi bài nộp, xác định bước lỗi và vị trí cần xử lý."],
    locations:["Vị trí gặp vấn đề","Vị trí gặp vấn đề","Khoanh vùng từ nhóm lỗi đến học liệu và câu hỏi cụ thể."],
    submissions:["Bài làm & xử lý AI","Bài làm & xử lý","Theo dõi từng đơn vị chấm và các bước xử lý liên quan."],
    audit:["Audit Log","Audit Log","Truy vết thao tác quản trị và thay đổi quyền truy cập."],
    permissions:["Phân quyền vận hành AI","Phân quyền","Thiết lập quyền xem dữ liệu, sửa cấu hình và xử lý bài theo vai trò."],
    lcms:["Quản lý cấu hình LCMS","Cấu hình LCMS","Kiểm tra liên kết học liệu, prompt và bộ chấm theo từng chương trình."],
    playground:["AI Playground theo chương trình","AI Playground","Soạn cấu hình chấm, thử bài mẫu và xem kết quả trước khi triển khai."],
    azure:["Cấu hình Azure Assessment","Azure Assessment","Quản lý quy tắc FSEL và tham số đánh giá phát âm của Azure."],
    ...aiGovernanceLabels,
    sla:["Quản trị SLA","Quản trị SLA","Theo dõi mục tiêu chấm AI và thời gian tiếp nhận, khắc phục sự cố."]};
  const current = labels[state.view];
  $("#page-title").textContent = current[0];
  $("#breadcrumb-current").textContent = current[1];
  $("#page-description").textContent = current[2];
  $("#role-name").textContent = roleLabel();
  $("#role-label").textContent = roleLabel();
  $("#last-updated").textContent = "Dữ liệu lúc " + timeLabel(state.lastUpdated) + " · VN";
  $("#freshness-copy").textContent = state.scenario === "offline" ? "Cập nhật đang gián đoạn" : "Cập nhật mỗi 60 giây";
  const dataDate=Object.hasOwn(aiGovernanceLabels,state.view)?"06/11/2026":"05/11/2026";
  $("#date-label").textContent = dataDate;
  $(".page-footer span").textContent = "Dữ liệu mẫu đến "+dataDate+" · Múi giờ Việt Nam";
  $(".filter-panel").hidden = state.view === "audit" || managementViews.includes(state.view) || state.scenario === "denied";
  $(".freshness").hidden = ["lcms","playground","azure",...Object.keys(aiGovernanceLabels)].includes(state.view);
  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active",button.dataset.view === state.view);
    if (button.dataset.view === state.view) button.setAttribute("aria-current","page");
    else button.removeAttribute("aria-current");
  });
  const data = filteredRows();
  $("#screen-content").innerHTML = renderState(data);
  const count = rootCauses.filter(cause => rows.some(row => !state.deleted.has(row.id) && row.cause === cause.id && hasProblem(row))).length;
  $("#nav-issue-count").textContent = count;
  activeFilterMarkup();
  $("#review-screen").textContent = ({overview:"WF-SCR-001 · Tổng quan",locations:"WF-SCR-002 · Vị trí lỗi",submissions:"WF-SCR-003 · Bài làm",audit:"WF-SCR-004 · Audit Log",lcms:"WF-SCR-005 · LCMS / USR-03 / ASM-07,08 / PROPOSED",playground:"WF-SCR-006 · Playground / USR-03 / ASM-07,09 / PROPOSED",azure:"WF-SCR-007 · Azure / USR-03, AZ-01 / ASM-07,10 / PROPOSED",sla:"WF-SCR-008 · SLA / USR-03, Q7 / ASM-11,12 / PROPOSED",permissions:"WF-SCR-009 · Phân quyền / USR-04, Q8 / ASM-13 / PROPOSED"})[state.view] || aiGovernanceReviewLabel(state.view);
}
function synchronizeFilters() {
  $("#search").value = state.query;
  $("#school-filter").value = state.school;
  $("#type-filter").value = state.type;
  $("#language-filter").value = state.language;
  $("#status-filter").value = state.status;
}
function clearFilters() {
  ["query","school","type","language","status","cause","location"].forEach(key => state[key] = "");
  synchronizeFilters();
  render();
}
function navigate(view) {
  if (state.view !== view && ["playground","azure"].includes(state.view)) stashManagementForm();
  state.view = view;
  render();
}
function notify(message) {
  clearTimeout(state.toastTimer);
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  state.toastTimer = setTimeout(() => $("#toast").hidden = true,3500);
}
function callout(row) {
  if (row.status === "fallback") return '<div class="detail-callout warning"><b>Đã áp dụng điểm dự phòng · AI xử lý lỗi</b><br>Kết quả AI không đúng cấu trúc. Điểm hiện có được ghi nhận theo quy tắc dự phòng của tình huống mẫu.</div>';
  if (row.status === "error") return '<div class="detail-callout"><b>' + row.error + '</b><br>' +
    (row.cause === "config" ? "Chưa tìm được cấu hình chấm cho phiên bản học liệu. Bước gọi AI đang chờ cấu hình hợp lệ." :
      row.cause === "release" ? "Phản hồi đã nhận cần kiểm tra lại cấu trúc trước khi áp dụng điểm." :
        "Dịch vụ trả lỗi. Theo dõi các lần thử và request để xác minh nguyên nhân.") + '</div>';
  if (row.status === "client") return '<div class="detail-callout warning"><b>Sự kiện trước nộp · ' + row.error +
    '</b><br>Đã nhận sự kiện chẩn đoán từ thiết bị. Server chưa xác nhận lưu bài nộp thành công.</div>';
  if (row.status === "waiting") return '<div class="detail-callout warning"><b>' + (isOverdue(row) ? "Đã chờ quá 30 giây" : "Bài đang được xử lý") +
    '</b><br>Thời gian từ server nhận bài là ' + elapsed(row) + ' giây. Bước đang theo dõi · ' + row.stage + '.</div>';
  return '<div class="detail-callout success"><b>Đã hoàn tất xử lý AI</b><br>Kết quả hợp lệ đã được lưu và đồng bộ tới Lesson trong tình huống mẫu.</div>';
}
function stepsFor(row) {
  if (!row.submitted) return [
    {name:"Chuẩn bị bài trên thiết bị",state:"done",time:"0s",note:row.platform},
    {name:row.stage,state:"failed",time:"2s",note:row.error,details:true},
    {name:"Server xác nhận bài nộp",state:"skipped",time:"—",note:"Chưa nhận bài nộp"}
  ];
  const steps = [{name:"Server xác nhận bài nộp",state:"done",time:"0s",note:row.root + " · Lần " + row.attempt}];
  if (row.speaking) {
    steps.push({name:"Kiểm tra & convert file",state:"done",time:"1,2s",note:"Audio WAV · Đúng định dạng"});
    steps.push({name:"Speech-to-Text",state:row.stage === "Azure STT" ? (row.status === "waiting" ? "waiting" : "failed") : "done",
      time:row.stage === "Azure STT" ? (row.status === "waiting" ? elapsed(row) + "s tổng" : "35s") : "3,4s",
      note:row.stage === "Azure STT" ? row.provider + " · " + (row.error || "Đang chờ kết quả") : "Transcript hợp lệ · " + row.language,
      details:row.stage === "Azure STT"});
  }
  steps.push({name:"Tìm cấu hình LCMS",state:row.cause === "config" ? "failed" : "done",
    time:row.cause === "config" ? "0,1s" : "0,2s",note:row.cause === "config" ? "ConfigErrorOccurred · " + row.version : row.config + " · " + row.configVersion,
    details:row.cause === "config"});
  if (row.cause === "config" || (row.stage === "Azure STT" && row.status !== "success")) {
    steps.push({name:"Chấm AI & kiểm tra kết quả",state:"skipped",time:"—",note:"Chờ bước phía trước hoàn tất"});
    steps.push({name:"Lưu điểm & cập nhật Lesson",state:"skipped",time:"—",note:"Chờ kết quả chấm"});
    return steps;
  }
  steps.push({name:"Kiểm duyệt nội dung",state:"done",time:"0,8s",note:"Đã kiểm tra theo cấu hình bài"});
  if (row.speaking) steps.push({name:"Azure Pronunciation Assessment",state:"done",time:"4,1s",note:"Điểm phát âm đã nhận"});
  steps.push({name:"Chấm AI & kiểm tra kết quả",state:row.status === "success" ? "done" : row.status === "waiting" ? "waiting" : "failed",
    time:row.status === "waiting" ? elapsed(row) + "s tổng" : row.duration + "s",note:row.error || (row.status === "success" ? "Kết quả hợp lệ" : "Đang chờ kết quả"),
    details:row.status !== "success"});
  steps.push({name:"Lưu điểm & cập nhật Lesson",state:row.status === "success" || row.status === "fallback" ? "done" : "skipped",
    time:row.status === "success" || row.status === "fallback" ? "0,3s" : "—",
    note:row.status === "fallback" ? "Đã lưu điểm dự phòng" : row.status === "success" ? "Đã đồng bộ Lesson" : "Đang chờ kết quả hợp lệ"});
  return steps;
}
function journeyMarkup(row) {
  return callout(row) + '<ol class="timeline">' + stepsFor(row).map(step =>
    '<li class="timeline-item"><span class="step-dot ' + step.state + '" aria-hidden="true">' +
    ({done:"✓",failed:"!",waiting:"◷",skipped:"–"})[step.state] + '</span><div><div class="step-title">' + step.name +
    '</div><p class="step-caption">' + escapeHtml(step.note) + '</p>' +
    (step.details ? '<div class="step-meta"><span>Nhà cung cấp<br><b>' + row.provider + '</b></span><span>Số lượt gọi<br><b>' +
      row.requests + '</b></span><span>Trace ID<br><b class="mono">trace-demo-' + row.id.toLowerCase() +
      '</b></span><span>Request nhà cung cấp<br><b class="mono">' + (row.requests ? "req-demo-" + row.id.toLowerCase() : "Chưa phát sinh") +
      '</b></span></div>' : "") + '</div><time class="step-time">' + step.time + '</time></li>').join("") + '</ol>';
}
function dataMarkup(row) {
  const response = row.status === "fallback" || row.cause === "release" ? '{"result": null, "validation": "invalid_schema"}' :
    row.cause === "config" ? '{"config": null, "error": "ConfigErrorOccurred"}' :
      row.status === "success" ? '{"valid": true, "score": 4.0, "scale": 5}' :
        '{"status": "' + (row.status === "waiting" ? "pending" : "failed") + '", "error": "' + row.error + '"}';
  return '<div class="detail-grid"><section class="data-section"><h3>Định danh & đầu vào</h3><dl class="data-pairs"><dt>Lượt nộp</dt><dd>' +
    row.root + '</dd><dt>Học viên</dt><dd>' + row.student + ' · Dữ liệu giả</dd><dt>Ngôn ngữ</dt><dd>' + row.language +
    '</dd><dt>Thiết bị</dt><dd>' + row.platform + '</dd><dt>File audio</dt><dd>' + (row.speaking ? "audio-demo.wav · metadata mô phỏng" : "Không áp dụng") +
    '</dd><dt>Transcript</dt><dd>' + escapeHtml(row.transcript || row.original) + '</dd></dl></section>' +
    '<section class="data-section"><h3>Cấu hình thực tế sử dụng</h3><dl class="data-pairs"><dt>Học liệu</dt><dd>' + row.question + ' · ' + row.version +
    '</dd><dt>Config</dt><dd>' + row.config + '</dd><dt>Phiên bản</dt><dd>' + row.configVersion +
    '</dd><dt>Phạm vi</dt><dd>Lesson → Project → Global</dd><dt>Model</dt><dd>deployment-demo-content</dd><dt>Phần mềm</dt><dd>' +
    row.build + '</dd></dl></section><section class="data-section full"><h3>Prompt chấm · Bản xem mô phỏng</h3><p class="muted small">Đánh giá bài làm theo rubric của học liệu và trả kết quả đúng cấu trúc đã cấu hình. Thông tin xác thực được loại bỏ trước khi ghi log.</p>' +
    '<div class="code-preview" style="margin-top:12px">' + escapeHtml(response) +
    '</div><p class="permission-note">Chỉ người dùng Academic hoặc Tech đã được cấp quyền xem dữ liệu chi tiết. Bản xem này sử dụng nội dung giả.</p></section></div>';
}
function historyMarkup(row) {
  const relevant = auditEvents.filter(event => event.target.split(" / ")[0] === row.id);
  return '<section class="data-section"><h3>Trạng thái điểm và thao tác</h3><dl class="data-pairs"><dt>Điểm hiện có</dt><dd>' + row.grade +
    '</dd><dt>Nguồn điểm</dt><dd>' + (row.status === "fallback" ? "Quy tắc dự phòng · Dữ liệu mẫu" : row.status === "success" ? "Kết quả AI" : "Đang chờ xử lý") +
    '</dd><dt>Lesson</dt><dd>' + row.lesson + '</dd><dt>Áp dụng điểm</dt><dd>Tự động · Lấy lần làm bài cao nhất theo quyết định Q6</dd></dl>' +
    (relevant.length ? relevant.map(event => '<p class="small muted" style="margin-top:16px">' + timeLabel(event.time) + ' · ' + event.action + ' · ' + escapeHtml(event.reason) + '</p>').join("") :
      '<p class="small muted" style="margin-top:16px">Chưa có thao tác quản trị trên bản ghi này trong phiên mô phỏng.</p>') +
    '</section><p class="permission-note">Luồng Academic/Mentor duyệt lại và phúc khảo đang được giữ cho giai đoạn sau theo Q6.</p>';
}
function baseDetailMarkup(row) {
  return '<div class="dialog-heading"><div><span class="eyebrow">CHI TIẾT LẦN XỬ LÝ AI</span><h2 id="detail-title">' + row.id + ' · ' + row.typeName +
    '</h2><p>' + row.student + ' · Lần nộp ' + row.attempt + ' · ' + row.language +
    '</p></div><button class="icon-button" data-close="detail-dialog" aria-label="Đóng chi tiết bài">×</button></div>' +
    '<dl class="detail-summary"><div><dt>Nộp bài</dt><dd>' + badge(row.submitted ? "Đã nộp thành công" : "Chưa nhận bài",row.submitted ? "success" : "neutral") +
    '</dd></div><div><dt>Xử lý AI</dt><dd>' + statusBadge(row) + '</dd></div><div><dt>Điểm hiện có</dt><dd>' + row.grade +
    '</dd></div><div><dt>Cập nhật Lesson</dt><dd>' + row.lesson + '</dd></div></dl><div class="detail-path">' + row.school + ' / ' + row.course + ' / ' +
    row.position + ' / <b>' + row.question + '</b> · Học liệu ' + row.version + '</div><div class="detail-tabs" role="tablist" aria-label="Thông tin bài làm">' +
    [["journey","Hành trình xử lý"],["data","Dữ liệu chấm"],["history","Lịch sử & điểm"]].map(([id,label]) =>
      '<button class="detail-tab" id="detail-tab-' + id + '" role="tab" aria-controls="detail-tab-panel" aria-selected="' +
      (state.detailTab === id) + '" tabindex="' + (state.detailTab === id ? "0" : "-1") + '" data-detail-tab="' + id + '">' + label + '</button>').join("") +
    '</div><div class="detail-body" id="detail-tab-panel" role="tabpanel" aria-labelledby="detail-tab-' + state.detailTab + '">' +
    (state.detailTab === "journey" ? journeyMarkup(row) : state.detailTab === "data" ? (can("sensitive") ? dataMarkup(row) : '<p>Bạn chưa được cấp quyền xem dữ liệu chấm. Liên hệ Admin tổng.</p>') : historyMarkup(row)) +
    '</div><div class="detail-footer"><p>Người chịu trách nhiệm bài treo · Tech vận hành</p>' +
    '<button class="button secondary" id="soft-delete"' + (!can("delete") ? ' disabled title="Cần quyền xóa mềm bản ghi theo dõi"' : "") +
    '>Xóa mềm bản ghi theo dõi</button></div>';
}
function openDetail(id) {
  const row = rows.find(item => item.id === id);
  if (!row || state.deleted.has(id)) return;
  state.current = id;
  state.detailTab = "journey";
  $("#detail-content").innerHTML = detailMarkup(row);
  $("#detail-dialog").showModal();
}
function openNotifications() {
  const affected = rows.filter(row => !state.deleted.has(row.id) && hasProblem(row));
  $("#alerts-content").innerHTML = '<p class="small muted" style="padding:16px 24px 0">Nhóm cảnh báo mô phỏng · ' + timeLabel(clockTime()) +
    '</p><div class="issue-list">' + issueCards(affected) +
    '</div><div class="panel-footer">Ngưỡng chờ quá 30 giây. Cơ chế nhận thông báo ngay đang là đề xuất review.</div>';
  $("#alerts-dialog").showModal();
}
function refreshData(advance=false) {
  if (state.scenario !== "normal") {
    notify("Đang giữ trạng thái mô phỏng. Đổi trạng thái trong Ghi chú review.");
    return;
  }
  state.offset = advance ? state.offset + 60 : Math.max(state.offset,Math.floor((Date.now() - state.started) / 1000));
  state.lastUpdated = clockTime();
  if (managementViews.includes(state.view) && !["sla","permissions"].includes(state.view)) stashManagementForm();
  if (!managementViews.includes(state.view) || (state.view === "sla" && state.slaTab !== "rules")) render();
  if (state.current && $("#detail-dialog").open) $("#detail-content").innerHTML = detailMarkup(rows.find(row => row.id === state.current));
}
function bindEvents() {
  document.addEventListener("click",event => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    if (button.dataset.close) {
      $("#" + button.dataset.close).close();
      return;
    }
    if (button.dataset.view) { navigate(button.dataset.view); return; }
    if (button.dataset.detail) { openDetail(button.dataset.detail); return; }
    if (button.dataset.detailTab) {
      state.detailTab = button.dataset.detailTab;
      $("#detail-content").innerHTML = detailMarkup(rows.find(row => row.id === state.current));
      $("#detail-tab-" + state.detailTab).focus();
      return;
    }
    if (button.hasAttribute("data-metric")) {
      state.status = button.dataset.metric;
      state.view = "submissions";
      synchronizeFilters(); render(); return;
    }
    if (button.dataset.cause) {
      state.cause = button.dataset.cause;
      state.view = "submissions";
      if ($("#alerts-dialog").open) $("#alerts-dialog").close();
      render(); return;
    }
    if (button.dataset.type) {state.type = button.dataset.type; state.view = "submissions"; synchronizeFilters(); render(); return;}
    if (button.dataset.status) {state.status = button.dataset.status; state.view = "submissions"; synchronizeFilters(); render(); return;}
    if (button.dataset.location) {state.location = button.dataset.location; state.view = "submissions"; render(); return;}
    if (button.dataset.removeFilter) {state[button.dataset.removeFilter] = ""; synchronizeFilters(); render(); return;}
    if (button.dataset.clear) {clearFilters(); return;}
    if (button.id === "soft-delete") {
      $("#delete-reason").value = "";
      $("#delete-error").hidden = true;
      $("#delete-dialog").showModal();
      $("#delete-reason").focus();
    }
  });
  [["search","query","input"],["school-filter","school","change"],["type-filter","type","change"],
    ["language-filter","language","change"],["status-filter","status","change"]].forEach(([id,key,eventName]) =>
      $("#" + id).addEventListener(eventName,event => {state[key] = event.target.value; render();}));
  $("#review-open").addEventListener("click",()=>$("#review-dialog").showModal());
  $("#notifications-open").addEventListener("click",openNotifications);
  $("#refresh").addEventListener("click",()=>{refreshData(); notify("Đã cập nhật bản dữ liệu mô phỏng.");});
  $("#demo-role").addEventListener("change",event => {state.role = event.target.value; render();});
  $("#demo-state").addEventListener("change",event => {state.scenario = event.target.value; render();});
  $("#demo-advance").addEventListener("click",()=>{refreshData(true); notify("Đồng hồ mô phỏng tăng 60 giây. Các bài chờ được kiểm tra lại.");});
  $("#demo-reset").addEventListener("click",()=>{
    state.deleted.clear(); state.offset = 0; state.lastUpdated = baseTime; state.started = Date.now();
    state.scenario = "normal"; state.role = "tech"; state.view = "overview"; state.current = null;
    resetManagement();
    $("#demo-state").value = "normal"; $("#demo-role").value = "tech";
    resetAudit(); clearFilters(); notify("Đã đặt lại dữ liệu mẫu.");
  });
  $("#confirm-delete").addEventListener("click",()=>{
    const reason = $("#delete-reason").value.trim();
    if (!reason) {$("#delete-error").hidden = false; $("#delete-reason").focus(); return;}
    if (!can("delete") || !state.current) return;
    state.deleted.add(state.current);
    auditEvents.push({time:clockTime(),actor:"Tech vận hành",action:"Xóa mềm bản ghi theo dõi",target:state.current,reason,result:"Đã xóa mềm"});
    $("#delete-dialog").close(); $("#detail-dialog").close(); state.current = null;
    render(); notify("Đã xóa mềm bản ghi mô phỏng và ghi Audit Log.");
  });
  document.addEventListener("keydown",event => {
    const tab = event.target.closest("[data-detail-tab]");
    if (!tab || !["ArrowRight","ArrowLeft","Home","End"].includes(event.key)) return;
    event.preventDefault();
    const ids = ["journey","data","history"];
    const position = ids.indexOf(state.detailTab);
    const next = event.key === "Home" ? 0 : event.key === "End" ? 2 : (position + (event.key === "ArrowRight" ? 1 : -1) + 3) % 3;
    state.detailTab = ids[next];
    $("#detail-content").innerHTML = detailMarkup(rows.find(row => row.id === state.current));
    $("#detail-tab-" + state.detailTab).focus();
  });
}
/* r0.2 exploration: all mutations and provider results are in-memory mock data. */
const managementViews = ["lcms","playground","azure","sla","permissions",...Object.keys(aiGovernanceLabels)];
const programList = [
  {id:"b1",name:"English B1",language:"Tiếng Anh",locale:"en-US"},
  {id:"vstep",name:"VSTEP",language:"Tiếng Anh",locale:"en-US"},
  {id:"hsk",name:"中文 HSK 3 / HSKK",language:"Tiếng Trung",locale:"zh-CN"},
  {id:"vi",name:"Tiếng Việt thực hành",language:"Tiếng Việt",locale:"vi-VN"},
  {id:"ja",name:"日本語 N4",language:"Tiếng Nhật",locale:"ja-JP"},
  {id:"ko",name:"한국어 2",language:"Tiếng Hàn",locale:"ko-KR"}
];
const permissionLabels = {
  sensitive:"Xem audio, transcript, prompt / response",lcms:"Soạn bản nháp cấu hình LCMS",
  playground:"Soạn & thử AI Playground",fsel:"Soạn bộ quy tắc FSEL",azure:"Soạn tham số Azure",
  sla:"Soạn chính sách SLA",route:"Xử lý lỗi & chuyển luồng chấm",incident:"Tiếp nhận / khắc phục sự cố",
  delete:"Xóa mềm bản ghi theo dõi",permissions:"Quản lý phân quyền"
};
let permissions, configs, prompts, azureProfiles, incidents, slaDraft;
const activeSla = Object.freeze({warning:30,target:60,ack:15,resolve:240});
function resetManagement() {
  resetAiGovernance();
  permissions = {
    tech:{sensitive:true,lcms:true,playground:true,fsel:true,azure:true,sla:true,route:true,incident:true,delete:true,permissions:false},
    academic:{sensitive:true,lcms:false,playground:true,fsel:true,azure:false,sla:false,route:false,incident:false,delete:false,permissions:false},
    admin:{sensitive:true,lcms:true,playground:true,fsel:true,azure:true,sla:true,route:true,incident:true,delete:false,permissions:true}
  };
  configs = [
    {id:"LC-001",program:"b1",type:"Class Forum",path:"Unit 3 / Lesson 2 / CF-007",version:"v7",mapping:"",object:"CF-ID-v7-007",prompt:"PG-b1",azure:"AZ-EN",affected:5,health:"Thiếu MappingId",draft:null},
    {id:"LC-002",program:"b1",type:"Listing",path:"Unit 2 / Lesson 4 / LIST-012",version:"v3",mapping:"MAP-LIST-012",object:"LIST-ID-v3-012",prompt:"PG-b1",azure:"",affected:3,health:"Đủ liên kết mẫu",draft:null},
    {id:"LC-003",program:"vstep",type:"VSTEP Speaking",path:"Đề mẫu 01 / Speaking / Part 1",version:"v2",mapping:"MAP-VSTEP-S1",object:"VS-ID-v2-01",prompt:"PG-vstep",azure:"AZ-EN",affected:0,health:"Đủ liên kết mẫu",draft:null},
    {id:"LC-004",program:"hsk",type:"HSKK",path:"Đề mẫu HSKK / Part 1",version:"Nháp",mapping:"MAP-HSKK-S1",object:"HSKK-ID-01",prompt:"PG-hsk",azure:"AZ-ZH",affected:0,health:"Chờ tích hợp",draft:null}
  ];
  prompts = programList.map(program=>({id:"PG-"+program.id,program:program.id,version:3,model:"Mô hình chấm mẫu A",system:"Bạn là người chấm bài của chương trình "+program.name+". Chỉ chấm theo rubric được cung cấp. Trả về kết quả đúng cấu trúc yêu cầu.",rubric:'{"criteria":["task_response","language_use"],"scale":5}',schema:'{"score":"number","feedback":"string","criteria":"array"}',sample:"This is a sample answer for review.",draft:null,test:null}));
  for(const id of ['b1','vstep']){const primary=prompts.find(prompt=>prompt.program===id);prompts.push({...primary,id:primary.id+'-alt',version:1,model:'Mô hình chấm mẫu B',alternative:true});}
  azureProfiles = [
    {id:"AZ-EN",name:"Speaking English",locale:"en-US",version:2,grading:"HundredMark",granularity:"Phoneme",mode:"single",miscue:true,prosody:true,reference:"question",scale:"5",rule:"Chưa chốt công thức quy đổi. Giữ riêng điểm Azure gốc để đối chiếu.",criteria:"Accuracy, Fluency, Completeness, Prosody",draft:null},
    {id:"AZ-ZH",name:"HSKK · Thử nghiệm",locale:"zh-CN",version:1,grading:"HundredMark",granularity:"Word",mode:"continuous",miscue:false,prosody:false,reference:"none",scale:"Chưa thiết lập",rule:"Cần Academic chốt rubric HSKK và cách quy đổi.",criteria:"Accuracy, Fluency",draft:null}
  ];
  incidents = [
    {id:"INC-001",cause:"config",title:"Không resolve cấu hình LCMS",start:baseTime-12*60000,ack:null,resolved:null,note:"",count:5},
    {id:"INC-002",cause:"release",title:"Kết quả AI sai cấu trúc",start:baseTime-22*60000,ack:baseTime-12*60000,resolved:null,note:"Đã tiếp nhận · dữ liệu mẫu",count:4},
    {id:"INC-003",cause:"provider",title:"Azure / OpenAI phản hồi lỗi",start:baseTime-7*60000,ack:null,resolved:null,note:"",count:5}
  ];
  slaDraft = null;
  Object.assign(state,{program:"",playgroundId:"PG-b1",azureId:"AZ-EN",azureTab:"fsel",slaTab:"overview",lcmsEditing:null});
  rows.forEach(row=>{delete row.opsAction;delete row.route;delete row.opsReason;});
}
function roleLabel(role=state.role) {return ({tech:"Tech vận hành",academic:"Academic",admin:"Admin tổng"})[role] || "Academic";}
function can(permission) {return !!permissions?.[state.role]?.[permission];}
function logManagement(action,target,reason,result="Đã lưu nháp") {
  auditEvents.push({time:clockTime(),actor:roleLabel(),action,target,reason,result});
}
function programName(id) {return programList.find(program=>program.id===id)?.name || "Chưa chọn";}
function rowProgram(row){return row.type.startsWith('vstep')?'vstep':programList.find(program=>program.name===row.course)?.id;}
function routeLabel(row){return ({resume:'Chờ tải tiếp',resubmit:'Chờ học viên gửi lại',convert:'Convert phía server',stt:'STT phía server',manual:'Chấm thủ công','retry-stage':'Chạy lại bước lỗi'})[row.route]||row.route||'Luồng gốc';}
function options(values,selected) {return values.map(value=>{const id=typeof value==="string"?value:value.id;const name=typeof value==="string"?value:value.name;return '<option value="'+escapeHtml(id)+'"'+(id===selected?' selected':'')+'>'+escapeHtml(name)+'</option>';}).join("");}
function field(id,label,value,help="",extra="") {return '<label for="'+id+'">'+label+'<input id="'+id+'" name="'+id+'" value="'+escapeHtml(value)+'" '+extra+'>'+(help?'<span class="field-help">'+help+'</span>':'')+'</label>';}
function selectField(id,label,values,value,help="",extra="") {return '<label for="'+id+'">'+label+'<select id="'+id+'" name="'+id+'" '+extra+'>'+options(values,value)+'</select>'+(help?'<span class="field-help">'+help+'</span>':'')+'</label>';}
function areaField(id,label,value,help="",rowsCount=4) {return '<label for="'+id+'">'+label+'<textarea id="'+id+'" name="'+id+'" rows="'+rowsCount+'">'+escapeHtml(value)+'</textarea>'+(help?'<span class="field-help">'+help+'</span>':'')+'</label>';}
function checkField(id,label,value,help="") {return '<label class="check-field"><input type="checkbox" id="'+id+'" name="'+id+'"'+(value?' checked':'')+'><span>'+label+(help?'<small>'+help+'</small>':'')+'</span></label>';}
function notice(text,tone="brand") {return '<div class="management-note '+tone+'">'+icon(tone==='warning'?'alert':'file')+'<p>'+text+'</p></div>';}
function draftBadge(entity) {return badge("Đang áp dụng v"+entity.version,"neutral")+(entity.draft?' '+badge("Có bản nháp mới","brand"):"");}
function programToolbar(action="") {return '<div class="management-toolbar">'+selectField("management-program","Chương trình",[{id:"",name:"Tất cả chương trình"},...programList],state.program)+'<span class="small muted">Danh mục chương trình và cấu hình mẫu</span>'+action+'</div>';}
function configActions(permission,id="") {return '<div class="form-actions"><span class="small muted">'+(can(permission)?'Lưu vào bản nháp · cần review trước triển khai':'Vai trò hiện tại có quyền xem · chưa có quyền sửa phần này')+'</span><button class="button primary" type="submit" '+(can(permission)?'':'disabled')+' id="'+id+'">Lưu bản nháp</button></div>';}
function renderManagement() {
  if (Object.hasOwn(aiGovernanceLabels, state.view)) return renderAiGovernance();
  if(state.view==='lcms')return renderLcms();
  if(state.view==='playground')return renderPlayground();
  if(state.view==='azure')return renderAzure();
  if(state.view==='sla')return renderSla();
  return renderPermissions();
}
function renderLcms() {
  const selected=configs.filter(config=>!state.program||config.program===state.program);
  return programToolbar('<button class="button primary" data-new-config '+(can('lcms')?'':'disabled')+'>Thêm cấu hình</button>')+
    notice('Kiểm tra MappingId, phiên bản học liệu và bộ chấm được liên kết. Thay đổi được lưu thành bản nháp; các bài lỗi cũ vẫn giữ nguyên lịch sử.')+
    '<section class="panel"><div class="panel-header"><div><h2>Cấu hình chấm theo học liệu</h2><p>Chương trình → bài học → câu hỏi → prompt / Azure</p></div>'+badge(selected.length+' cấu hình','neutral')+'</div><div class="table-scroll"><table><thead><tr><th>Chương trình / vị trí bài học</th><th>Định danh & phiên bản</th><th>Bộ cấu hình liên kết</th><th>Tình trạng liên kết</th><th></th></tr></thead><tbody>'+selected.map(config=>'<tr><td class="cell-path"><strong>'+programName(config.program)+'</strong><small>'+escapeHtml(config.path)+'</small><small>'+config.type+'</small></td><td><strong>'+config.id+' · '+config.version+'</strong><small>MappingId · '+escapeHtml(config.mapping||'Chưa thiết lập')+'</small><small>ObjectId · '+config.object+'</small></td><td><strong>'+config.prompt+'</strong><small>Azure · '+(config.azure||'Không sử dụng')+'</small>'+(config.draft?badge('Có bản nháp mới','brand'):'')+'</td><td>'+badge(config.health,config.mapping?(config.version==='Nháp'?'warning':'success'):'error')+(config.affected?'<small>'+config.affected+' bài đang có lỗi trong dữ liệu mẫu</small>':'')+'</td><td><button class="button text" data-edit-config="'+config.id+'">Xem / cấu hình →</button></td></tr>').join('')+'</tbody></table></div></section>';
}
function openLcms(id) {
  const entity=configs.find(config=>config.id===id);
  const value=entity?.draft||entity||{program:state.program||'b1',type:'Class Forum',path:'',version:'Nháp',mapping:'',object:'',prompt:'PG-b1',azure:''};
  state.lcmsEditing=id||'new';
  $('#config-dialog-content').innerHTML='<div class="dialog-heading"><div><span class="eyebrow">CẤU HÌNH LCMS</span><h2 id="config-title">'+(entity?entity.id+' · Bản nháp cấu hình':'Thêm cấu hình học liệu')+'</h2><p>Thay đổi liên kết theo phiên bản; giữ nguyên bản đang áp dụng.</p></div><button class="icon-button" data-close="config-dialog" aria-label="Đóng cấu hình">×</button></div><form id="lcms-form" class="management-form">'+
    '<fieldset '+(can('lcms')?'':'disabled')+'><div class="form-grid">'+selectField('cfg-program','Chương trình',programList,value.program)+selectField('cfg-type','Loại bài',types.map(type=>type.name),value.type)+field('cfg-path','Vị trí bài học / câu hỏi',value.path,'Khóa → Unit → Lesson → câu hỏi.','required')+field('cfg-version','Phiên bản học liệu',value.version,'Phiên bản gắn với liên kết này.','required')+field('cfg-mapping','MappingId',value.mapping,'Khóa mapping cần kiểm tra với học liệu.','required')+field('cfg-object','ObjectId',value.object,'Mã đối tượng theo phiên bản, cần đối chiếu mapping.','required')+selectField('cfg-prompt','AI Playground',prompts.map(prompt=>({id:prompt.id,name:prompt.id+' · '+programName(prompt.program)})),value.prompt)+selectField('cfg-azure','Azure Assessment',[{id:'',name:'Không sử dụng'},...azureProfiles.map(profile=>({id:profile.id,name:profile.id+' · '+profile.name}))],value.azure)+'</div></fieldset><div id="lcms-check" class="validation-box" role="status">Chưa kiểm tra bản nháp.</div><div class="form-actions"><button type="button" class="button secondary" data-validate-config>Kiểm tra liên kết mẫu</button>'+(entity?.affected?'<button type="button" class="button text" data-config-affected="'+entity.id+'">Xem '+entity.affected+' bài lỗi →</button>':'')+'<button class="button primary" type="submit" '+(can('lcms')?'':'disabled')+'>Lưu bản nháp</button></div></form>';
  $('#config-dialog').showModal();
}
function lcmsValues() {const form=$('#lcms-form');return {program:form.elements['cfg-program'].value,type:form.elements['cfg-type'].value,path:form.elements['cfg-path'].value.trim(),version:form.elements['cfg-version'].value.trim(),mapping:form.elements['cfg-mapping'].value.trim(),object:form.elements['cfg-object'].value.trim(),prompt:form.elements['cfg-prompt'].value,azure:form.elements['cfg-azure'].value};}
function validateLcms(value) {
  const issues=[];
  if(!value.mapping||!value.object||!value.path||!value.version)issues.push('Bổ sung vị trí, phiên bản, MappingId và ObjectId.');
  if(prompts.find(prompt=>prompt.id===value.prompt)?.program!==value.program)issues.push('AI Playground đang thuộc chương trình khác.');
  if(value.azure){const profile=azureProfiles.find(profile=>profile.id===value.azure);const program=programList.find(program=>program.id===value.program);if(profile?.locale!==program?.locale)issues.push('Locale Azure khác locale chương trình; cần kiểm tra lại.');}
  return issues;
}
function selectedPrompt() {return prompts.find(prompt=>prompt.id===state.playgroundId)||prompts[0];}
function renderPlayground() {
  const entity=selectedPrompt(),value=entity.working||entity.draft||entity;
  const list=prompts.filter(prompt=>!state.program||prompt.program===state.program);
  return programToolbar()+notice('Thử nghiệm trên bài mẫu. Kết quả chạy thử là mô phỏng, không gửi dữ liệu tới nhà cung cấp AI.')+
    '<div class="configuration-layout"><section class="panel config-picker"><div class="panel-header"><h2>Chương trình</h2></div>'+list.map(prompt=>'<button class="profile-item '+(prompt.id===entity.id?'selected':'')+'" data-prompt="'+prompt.id+'"><strong>'+programName(prompt.program)+(prompt.alternative?' · Luồng dự phòng':'')+'</strong><small>'+prompt.id+' · v'+prompt.version+(prompt.draft?' · Có bản nháp':'')+'</small></button>').join('')+'</section><section class="panel"><div class="panel-header"><div><h2>'+programName(entity.program)+'</h2><p>'+entity.id+' · Cấu hình chấm nội dung</p></div><div>'+draftBadge(entity)+'</div></div><form id="playground-form" class="management-form"><fieldset '+(can('playground')?'':'disabled')+'><div class="form-grid">'+field('pg-model','Mô hình triển khai',value.model,'Tên triển khai mẫu; chưa xác minh model production.','required')+field('pg-version','Phiên bản prompt đang áp dụng','v'+entity.version,'Bản nháp được lưu riêng.','readonly')+'</div>'+areaField('pg-system','Hướng dẫn chấm / system prompt',value.system,'Nội dung mẫu, Academic cần chốt rubric chương trình.',5)+'<div class="form-grid">'+areaField('pg-rubric','Rubric (JSON)',value.rubric,'Kiểm tra cú pháp JSON trong demo.',5)+areaField('pg-schema','Cấu trúc kết quả mong đợi (JSON)',value.schema,'Mô tả cấu trúc thử; chưa là API contract.',5)+'</div>'+areaField('pg-sample','Bài làm mẫu',value.sample,'Dùng dữ liệu giả để thử.',3)+'</fieldset><div id="playground-validation" role="status" class="validation-box">'+(entity.draft?'Đã lưu bản nháp mới; cấu hình đang áp dụng vẫn là v'+entity.version+'.':'Bản đang áp dụng được dùng làm điểm bắt đầu cho bản nháp.')+'</div><div class="form-actions"><button class="button secondary" type="button" data-run-playground '+(can('playground')?'':'disabled')+'>Chạy thử mô phỏng</button><button class="button primary" type="submit" '+(can('playground')?'':'disabled')+'>Lưu bản nháp</button></div><div id="playground-result" class="simulation-result" '+(entity.test?'':'hidden')+'><h3>Kết quả mô phỏng</h3><p class="small muted">Kết quả cố định để review giao diện · không phải kết quả AI thật.</p><pre class="code-preview">'+escapeHtml(entity.test||'')+'</pre></div></form></section></div>';
}
function selectedAzure() {return azureProfiles.find(profile=>profile.id===state.azureId)||azureProfiles[0];}
function renderAzure() {
  const entity=selectedAzure(),value=entity.working||entity.draft||entity;
  const key=state.azureTab==='fsel'?'fsel':'azure';
  return notice('Bộ quy tắc FSEL và tham số Azure được lưu cùng phiên bản hồ sơ. Các trường FSEL đang là đề xuất để review; chưa có bộ cấu hình chuẩn được xác minh.')+
    '<div class="management-toolbar">'+selectField('azure-profile','Bộ cấu hình',azureProfiles.map(profile=>({id:profile.id,name:profile.id+' · '+profile.name})),entity.id)+'<div>'+draftBadge(entity)+'</div></div><section class="panel"><div class="panel-header"><div><h2>'+entity.name+'</h2><p>Áp dụng mẫu · '+(entity.id==='AZ-EN'?'English B1, VSTEP':'HSKK · Chờ tích hợp')+'</p></div><span class="small muted">Điểm Azure gốc được giữ riêng</span></div>'+managementTabs('azure',[['fsel','Bộ cấu hình FSEL'],['provider','Tham số Azure']],state.azureTab)+
    '<div id="azure-panel" role="tabpanel" aria-labelledby="azure-tab-'+state.azureTab+'"><form id="azure-form" class="management-form"><fieldset '+(can(key)?'':'disabled')+'>'+(key==='fsel'?'<div class="form-grid">'+field('az-criteria','Các tiêu chí sử dụng',value.criteria,'Danh sách mẫu, cần Academic xác nhận.','required')+selectField('az-scale','Thang điểm đầu ra FSEL',['Chưa thiết lập','5','10','100'],value.scale,'Chọn thang điểm không tự tạo công thức quy đổi.')+'</div>'+areaField('az-rule','Quy tắc quy đổi & xử lý thiếu tiêu chí',value.rule,'Chưa áp dụng công thức vào điểm học tập trong wireframe.',4):'<div class="form-grid">'+selectField('az-locale','Locale',['en-US','zh-CN','vi-VN','ja-JP','ko-KR'],value.locale,'Cần kiểm tra coverage Azure theo locale trước triển khai.')+selectField('az-grading','GradingSystem',['HundredMark','FivePoint'],value.grading)+selectField('az-granularity','Granularity',['Phoneme','Word','FullText'],value.granularity)+selectField('az-mode','Chế độ xử lý âm thanh',[{id:'single',name:'Một đoạn (single)'},{id:'continuous',name:'Liên tục (continuous)'}],value.mode,'Chế độ điều phối SDK; không phải field trong AssessmentConfig.')+selectField('az-reference','Nguồn ReferenceText',[{id:'question',name:'Nội dung đọc từ câu hỏi'},{id:'none',name:'Không truyền (unscripted)'}],value.reference)+'</div><div class="checkbox-grid">'+checkField('az-miscue','EnableMiscue',value.miscue,'So sánh bỏ / thêm từ với ReferenceText.')+checkField('az-prosody','EnableProsodyAssessment',value.prosody,'Theo tài liệu đã đọc: chỉ en-US.')+'</div>')+'</fieldset><div id="azure-validation" class="validation-box" role="status">'+azureMessage(value)+'</div>'+configActions(key,'save-azure')+'</form></div></section><div class="coverage-strip">'+icon('alert')+'<span>Coverage: en-US / zh-CN là hồ sơ mẫu; vi-VN, ja-JP, ko-KR chưa xác minh khả năng Assessment trong phạm vi này.</span></div>';
}
function azureIssues(value) {
  const issues=[];
  if(value.prosody&&value.locale!=='en-US')issues.push('Prosody chỉ hỗ trợ en-US theo tài liệu Azure đã đọc.');
  if(value.miscue&&value.mode==='continuous')issues.push('EnableMiscue không được hỗ trợ trong continuous mode.');
  if(value.miscue&&value.reference==='none')issues.push('Bản nháp cần ReferenceText khi bật EnableMiscue.');
  if(!['en-US','zh-CN'].includes(value.locale))issues.push('Locale chưa được xác minh Assessment trong bản nháp này.');
  return issues;
}
function azureMessage(value) {const issues=azureIssues(value);return issues.length?'Cần kiểm tra: '+issues.map(escapeHtml).join(' '):'Kiểm tra điều kiện mẫu đạt. Khả năng thực tế cần xác nhận với SDK / resource Azure triển khai.';}
function managementTabs(kind,tabs,selected) {return '<div class="management-tabs" role="tablist" aria-label="'+(kind==='azure'?'Nhóm cấu hình Azure':'Nội dung SLA')+'">'+tabs.map(([id,label])=>'<button class="management-tab" id="'+kind+'-tab-'+id+'" role="tab" aria-controls="'+kind+'-panel" aria-selected="'+(selected===id)+'" tabindex="'+(selected===id?'0':'-1')+'" data-management-tab="'+kind+'" data-tab="'+id+'">'+label+'</button>').join('')+'</div>';}
function slaCohort() {
  const cohort=rows.filter(row=>row.submitted&&!state.deleted.has(row.id));
  const pending=cohort.filter(row=>row.status==='waiting'&&elapsed(row)<=activeSla.target);
  const met=cohort.filter(row=>row.status==='success'&&row.duration<=activeSla.target);
  const failed=cohort.filter(row=>['error','fallback'].includes(row.status)||(row.status==='success'&&row.duration>activeSla.target)||(row.status==='waiting'&&elapsed(row)>activeSla.target));
  const durations=cohort.filter(row=>row.status==='success').map(row=>row.duration).sort((a,b)=>a-b);
  return {cohort,pending,met,failed,p95:durations.length?durations[Math.ceil(.95*durations.length)-1]:null};
}
function renderSla() {
  const metrics=slaCohort();const measured=metrics.met.length+metrics.failed.length;
  let content='';
  if(state.slaTab==='overview')content='<div class="sla-metrics">'+[
    ['Đạt mục tiêu chấm',measured?(100*metrics.met.length/measured).toFixed(1)+'%':'—',metrics.met.length+' / '+measured+' đơn vị đã đánh giá'],
    ['Không đạt',metrics.failed.length,'AI lỗi / dự phòng / vượt '+activeSla.target+'s'],
    ['Đang trong hạn',metrics.pending.length,'Chưa đưa vào mẫu số đạt / không đạt'],
    ['P95 chấm thành công',metrics.p95===null?'—':metrics.p95+'s','Chỉ tính các đơn vị AI hoàn tất']
  ].map(([label,value,note])=>'<div class="metric"><span class="metric-label">'+label+'</span><strong class="metric-value">'+value+'</strong><span class="metric-foot">'+note+'</span></div>').join('')+'</div>'+notice('Cửa sổ mẫu: '+metrics.cohort.length+' đơn vị AI đã nhận. Điểm dự phòng vẫn tính AI không đạt; lỗi trước nộp được theo dõi riêng. Tỷ lệ này không phải cam kết uptime của Azure / OpenAI.')+'<section class="panel"><div class="panel-header"><div><h2>Định nghĩa đo lường đang mô phỏng</h2><p>Mục tiêu và chính sách cần PO / Tech thống nhất trước triển khai</p></div><button class="button text" data-sla-open-rules>Chính sách →</button></div><div class="sla-definitions"><div><b>Chấm AI · mục tiêu mẫu '+activeSla.target+' giây</b><p>Từ server nhận bài đến lưu đủ kết quả bắt buộc. Tính cả chờ, retry và xử lý nội bộ.</p></div><div><b>Cảnh báo chờ · quá 30 giây</b><p>Ngưỡng theo Q7; cảnh báo và mục tiêu SLA là hai chỉ số riêng.</p></div><div><b>Tiếp nhận · '+activeSla.ack+' phút / khắc phục · '+activeSla.resolve/60+' giờ</b><p>Mẫu 24/7, tính từ phát hiện sự cố, chưa tạm dừng đồng hồ khi chờ nhà cung cấp.</p></div><div><b>Người chịu trách nhiệm · Tech vận hành</b><p>Kênh cảnh báo FSEL Portal. Lịch làm việc, escalation và SLA nhà cung cấp còn cần chốt.</p></div></div><div class="panel-footer">Mẫu số = số đạt + số không đạt. Bài đang trong hạn chưa được kết luận; sự cố khắc phục không tự thay lịch sử SLA.</div></section>';
  else if(state.slaTab==='rules') {
    const value=slaDraft||activeSla;
    content='<section class="panel"><div class="panel-header"><div><h2>Chính sách SLA mẫu · v1</h2><p>Phạm vi thử: tất cả chương trình / loại bài AI, đồng hồ 24/7</p></div>'+(slaDraft?badge('Có bản nháp mới','brand'):badge('Chính sách mô phỏng','neutral'))+'</div><form id="sla-form" class="management-form"><fieldset '+(can('sla')?'':'disabled')+'><div class="form-grid">'+field('sla-warning','Cảnh báo chờ (giây)',30,'Theo Q7, giữ nguyên trong vòng chỉnh này.','type="number" readonly')+field('sla-target','Mục tiêu hoàn tất chấm (giây)',value.target,'Đề xuất mẫu, chưa là cam kết FSEL.','type="number" min="31" required')+field('sla-ack','Thời gian tiếp nhận (phút)',value.ack,'Tính từ phát hiện sự cố.','type="number" min="1" required')+field('sla-resolve','Thời gian khắc phục (phút)',value.resolve,'Mẫu 240 phút = 4 giờ.','type="number" min="1" required')+'</div>'+areaField('sla-reason','Lý do điều chỉnh',slaDraft?.reason||'','Bắt buộc để truy vết. Giữ riêng bản nháp, chưa đổi đồng hồ đang mô phỏng.',2)+'</fieldset><div id="sla-validation" class="validation-box" role="status">Mục tiêu mẫu hiện hành: 60s / tiếp nhận 15 phút / khắc phục 240 phút.</div>'+configActions('sla')+'</form></section>';
  }else content=renderIncidents();
  return notice('Chính sách SLA đang mô phỏng: mục tiêu chấm 60s, tiếp nhận 15 phút, khắc phục 4 giờ. Đây là giá trị đề xuất để review, chưa là cam kết đã duyệt.','warning')+managementTabs('sla',[['overview','Tổng quan SLA'],['rules','Chính sách SLA'],['incidents','Sự cố & tiếp nhận']],state.slaTab)+'<div id="sla-panel" role="tabpanel" aria-labelledby="sla-tab-'+state.slaTab+'">'+content+'</div>';
}
function renderIncidents() {
  return '<section class="panel"><div class="panel-header"><div><h2>Sự cố cần vận hành xử lý</h2><p>Tech chịu trách nhiệm; sự cố và trạng thái từng bài được theo dõi riêng.</p></div>'+badge(incidents.filter(incident=>!incident.resolved).length+' đang mở','warning')+'</div><div class="table-scroll"><table><thead><tr><th>Sự cố / phạm vi</th><th>Đồng hồ tiếp nhận</th><th>Hạn khắc phục</th><th>Trạng thái</th><th>Hành động</th></tr></thead><tbody>'+incidents.map(incident=>{const mins=Math.floor(((incident.ack||clockTime())-incident.start)/60000);const left=Math.max(0,activeSla.resolve-Math.floor(((incident.resolved||clockTime())-incident.start)/60000));return '<tr><td><strong>'+incident.id+' · '+incident.title+'</strong><small>'+incident.count+' đơn vị ảnh hưởng · Tech vận hành</small><button class="button text" data-cause="'+incident.cause+'">Xem bài & vị trí →</button></td><td>'+badge((incident.ack?'Đã nhận · ':'Đang chờ · ')+mins+' phút',mins>activeSla.ack?'error':incident.ack?'success':'warning')+'<small>Mục tiêu '+activeSla.ack+' phút từ phát hiện</small></td><td><strong>'+(incident.resolved?'Đã ghi nhận khắc phục':'Còn '+left+' phút')+'</strong><small>Hạn · '+timeLabel(incident.start+activeSla.resolve*60000)+'</small></td><td>'+badge(incident.resolved?'Đã khắc phục':incident.ack?'Đang xử lý':'Chưa tiếp nhận',incident.resolved?'success':'warning')+(incident.note?'<small>'+escapeHtml(incident.note)+'</small>':'')+'</td><td>'+(incident.resolved?'—':'<button class="button secondary" data-incident="'+incident.id+'" '+(can('incident')?'':'disabled')+'>'+(incident.ack?'Ghi nhận khắc phục':'Tiếp nhận')+'</button>')+'</td></tr>';}).join('')+'</tbody></table></div></section>';
}
function renderPermissions() {
  return notice('Phân quyền mẫu theo vai trò, phạm vi toàn bộ dữ liệu giả. Admin tổng điều chỉnh quyền trong demo; phân quyền theo đơn vị / chương trình và việc tách người duyệt cần xác nhận trước triển khai.','warning')+
    '<section class="panel"><div class="panel-header"><div><h2>Ma trận quyền vận hành AI</h2><p>Vai trò đang dùng · '+roleLabel()+'</p></div><button class="button secondary" data-switch-role>Mô phỏng vai trò</button></div><form id="permissions-form"><div class="table-scroll"><table><thead><tr><th>Chức năng / hành động</th><th>Academic</th><th>Tech vận hành</th><th>Admin tổng</th></tr></thead><tbody>'+Object.entries(permissionLabels).map(([key,label])=>'<tr><td><strong>'+label+'</strong></td>'+['academic','tech','admin'].map(role=>'<td><label class="permission-check"><input type="checkbox" name="perm-'+role+'-'+key+'" aria-label="'+label+' · '+roleLabel(role)+'" '+(permissions[role][key]?'checked ':'')+(!can('permissions')||(role==='admin'&&key==='permissions')?'disabled':'')+'></label></td>').join('')+'</tr>').join('')+'</tbody></table></div><div class="management-form">'+areaField('permission-reason','Lý do điều chỉnh quyền','','Admin tổng nhập lý do; thao tác chỉ áp dụng cho phiên mô phỏng.',2)+'<div id="permissions-validation" class="validation-box" role="status">Quyền trong prototype chỉ điều khiển giao diện; hệ thống thật cần kiểm tra quyền tại backend.</div><div class="form-actions"><span class="small muted">'+(can('permissions')?'Admin tổng quản lý quyền mô phỏng':'Liên hệ Admin tổng để điều chỉnh quyền')+'</span><button class="button primary" type="submit" '+(can('permissions')?'':'disabled')+'>Áp dụng quyền mô phỏng</button></div></div></form></section>';
}
function detailMarkup(row) {
  let html=baseDetailMarkup(row);
  const phase=row.status==='client'?'Trước AI chính':'Sau khi nhận bài';
  const action=('<section class="operation-section"><div><h3>Vị trí bài học & điều phối chấm</h3><p>'+escapeHtml(row.school+' → '+row.course+' → '+row.position+' → '+row.question)+' · '+escapeHtml(row.version)+'</p></div><div class="operation-summary">'+badge(phase,'neutral')+badge(routeLabel(row),'brand')+(row.opsAction?badge('Đã yêu cầu '+row.opsAction,'warning'):'')+'</div>'+(row.status==='client'?'<p class="small muted">Bước bị dừng: '+row.stage+' · '+row.error+'. Lỗi này được ghi nhận trước khi bắt đầu chấm nội dung AI.</p>':'')+(row.opsReason?'<p class="small muted">Lý do gần nhất: '+escapeHtml(row.opsReason)+'</p>':'')+'<div class="operation-buttons">'+(hasProblem(row)?'<button class="button secondary" data-operate="'+row.id+'" '+(can('route')?'':'disabled')+'>Xử lý lỗi / chuyển luồng</button>':'')+'<button class="button text" data-open-row-config="'+row.id+'">Xem cấu hình tại vị trí →</button></div>'+(can('route')?'':'<p class="small muted">Cần quyền xử lý lỗi & chuyển luồng chấm.</p>')+'</section>');
  return html.replace('<div class="detail-footer">',action+'<div class="detail-footer">');
}
function routeOptions(row) {
  if(row.status!=='client')return [
    {id:'retry-stage',name:'Chạy lại bước đang lỗi'},
    {id:'alternate',name:'Chuyển bộ chấm AI khác'},
    {id:'manual',name:'Chuyển Academic / Mentor chấm thủ công'}
  ];
  if(row.error==='NetworkDisconnected')return [{id:'resume',name:'Tiếp tục tải lên sau khi có mạng'},{id:'resubmit',name:'Yêu cầu học viên gửi lại'}];
  if(row.error==='InvalidAudioFile')return [{id:'resubmit',name:'Yêu cầu thu âm / tải file hợp lệ'}];
  if(row.error==='AudioConversionFailed')return [{id:'convert',name:'Thử convert phía server'},{id:'resubmit',name:'Yêu cầu học viên thu âm lại'}];
  return [{id:'stt',name:'Chuyển STT phía server (Azure)'},{id:'resubmit',name:'Yêu cầu học viên thu âm lại'},{id:'manual',name:'Chuyển Academic / Mentor chấm thủ công'}];
}
function openOperation(id) {
  const row=rows.find(item=>item.id===id);if(!row||!can('route'))return;
  state.operationId=id;
  $('#config-dialog-content').innerHTML='<div class="dialog-heading"><div><span class="eyebrow">ĐIỀU PHỐI XỬ LÝ</span><h2 id="config-title">'+id+' · Xử lý lỗi / chuyển luồng</h2><p>'+row.stage+' · '+row.error+'</p></div><button class="icon-button" data-close="config-dialog" aria-label="Đóng điều phối">×</button></div><form id="operation-form" class="management-form">'+notice(escapeHtml(row.course+' → '+row.position+' → '+row.question)+' · '+escapeHtml(row.version))+'<div class="form-grid">'+selectField('op-action','Hành động',routeOptions(row),routeOptions(row)[0].id)+selectField('op-target','Bộ chấm AI thay thế',prompts.map(prompt=>({id:prompt.id,name:prompt.id+' · '+programName(prompt.program)})),prompts.find(prompt=>prompt.program===rowProgram(row)&&prompt.alternative)?.id||'PG-b1-alt')+'</div><p id="route-help" class="field-help">'+operationHelp(routeOptions(row)[0].id)+'</p>'+areaField('op-reason','Lý do thao tác','','Bắt buộc. Cấu hình gốc, request cũ và lịch sử điểm được giữ để truy vết.',3)+'<div id="operation-validation" class="validation-box" role="status">Chỉ tạo yêu cầu xử lý mô phỏng. Điểm và trạng thái lỗi lịch sử vẫn được giữ nguyên.</div><div class="form-actions"><button class="button secondary" type="button" data-close="config-dialog">Hủy</button><button class="button primary" type="submit">Xác nhận yêu cầu mô phỏng</button></div></form>';
  updateOperationTarget();$('#config-dialog').showModal();
}
function operationHelp(action) {return ({resume:'Chờ thiết bị khôi phục mạng và tiếp tục tải. Giữ cùng phiên nộp để tránh tạo bài trùng.',resubmit:'Chờ học viên cung cấp file / bài mới; giữ sự kiện lỗi ban đầu.',convert:'Yêu cầu worker phía server thử convert trên file còn truy cập được. Khả năng này cần Tech xác nhận.',stt:'Chuyển nhánh transcript sang Azure STT khi file âm thanh hợp lệ. Chỉ gửi AI chính sau khi đủ đầu vào.',manual:'Tạo yêu cầu chấm thủ công. Đây là luồng đề xuất cần Academic / Mentor xác nhận; không tự sinh điểm.',alternate:'Dùng bộ chấm của cùng chương trình, tạo lượt xử lý mới. Không ghi đè request hoặc kết quả cũ.','retry-stage':'Tạo lượt xử lý mới từ bước đang lỗi, giữ nguyên bài nộp. Chống lặp yêu cầu ở mức demo.'})[action]||'';}
function updateOperationTarget(){const action=$('#op-action')?.value;if(!action)return;$('#op-target').closest('label').hidden=action!=='alternate';$('#route-help').textContent=operationHelp(action);}
function stashManagementForm() {
  if(state.view==='playground'&&$('#playground-form')){
    const entity=selectedPrompt();entity.working={...entity.working||entity.draft||entity,model:$('#pg-model').value,system:$('#pg-system').value,rubric:$('#pg-rubric').value,schema:$('#pg-schema').value,sample:$('#pg-sample').value};
  }
  if(state.view==='azure'&&$('#azure-form')){
    const entity=selectedAzure(),value={...entity.working||entity.draft||entity};
    if(state.azureTab==='fsel')Object.assign(value,{criteria:$('#az-criteria').value,scale:$('#az-scale').value,rule:$('#az-rule').value});
    else Object.assign(value,{locale:$('#az-locale').value,grading:$('#az-grading').value,granularity:$('#az-granularity').value,mode:$('#az-mode').value,reference:$('#az-reference').value,miscue:$('#az-miscue').checked,prosody:$('#az-prosody').checked});
    entity.working=value;
  }
}
function promptIssues(value) {const issues=[];if(!value.model.trim()||!value.system.trim()||!value.sample.trim())issues.push('Bổ sung mô hình, hướng dẫn chấm và bài mẫu.');for(const [key,label] of [['rubric','Rubric'],['schema','Cấu trúc kết quả']])try{const result=JSON.parse(value[key]);if(!result||Array.isArray(result)||typeof result!=='object')issues.push(label+' phải là JSON object.');}catch{issues.push(label+' sai cú pháp JSON.');}return issues;}
function bindManagementEvents() {
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||button.disabled)return;
    if(button.hasAttribute('data-new-config'))return openLcms(null);
    if(button.dataset.editConfig)return openLcms(button.dataset.editConfig);
    if(button.dataset.prompt){stashManagementForm();state.playgroundId=button.dataset.prompt;render();return;}
    if(button.dataset.managementTab){stashManagementForm();state[button.dataset.managementTab+'Tab']=button.dataset.tab;render();$('#'+button.dataset.managementTab+'-tab-'+button.dataset.tab).focus();return;}
    if(button.hasAttribute('data-run-playground')){
      if(!can('playground'))return;stashManagementForm();const entity=selectedPrompt(),issues=promptIssues(entity.working);
      $('#playground-validation').textContent=issues.length?issues.join(' '):'Chạy thử mô phỏng hoàn tất. Không phát sinh API call.';
      if(issues.length)return;
      entity.test=JSON.stringify({simulation:true,score:3.5,feedback:'Phản hồi mẫu để review cấu trúc kết quả.',criteria:[{name:'task_response',score:3.5}]},null,2);
      $('#playground-result').hidden=false;$('#playground-result pre').textContent=entity.test;
      logManagement('Chạy thử Playground',entity.id,'Bài mẫu và kết quả giả lập','Hoàn tất mô phỏng');return;
    }
    if(button.hasAttribute('data-validate-config')){const issues=validateLcms(lcmsValues());$('#lcms-check').textContent=issues.length?issues.join(' '):'Đủ liên kết trong danh mục mẫu. Chưa kiểm tra LCMS / API / dữ liệu thật.';return;}
    if(button.dataset.configAffected){const config=configs.find(item=>item.id===button.dataset.configAffected);const row=rows.find(item=>config.path.includes(item.question));$('#config-dialog').close();state.cause='';state.location=row?locationKey(row):'';state.view='submissions';synchronizeFilters();render();return;}
    if(button.dataset.openRowConfig){const row=rows.find(item=>item.id===button.dataset.openRowConfig);$('#detail-dialog').close();const config=configs.find(item=>item.path.includes(row.question));if(config)openLcms(config.id);else {state.program='';navigate('lcms');notify('Chưa có cấu hình mẫu tại vị trí này. Có thể thêm bản nháp cấu hình.');}return;}
    if(button.dataset.operate)return openOperation(button.dataset.operate);
    if(button.hasAttribute('data-sla-open-rules')){state.slaTab='rules';render();return;}
    if(button.hasAttribute('data-switch-role'))return $('#review-dialog').showModal();
    if(button.dataset.incident){const incident=incidents.find(item=>item.id===button.dataset.incident);if(!can('incident'))return;state.incidentId=incident.id;$('#config-dialog-content').innerHTML='<div class="dialog-heading"><h2 id="config-title">'+incident.id+' · '+(incident.ack?'Ghi nhận khắc phục':'Tiếp nhận sự cố')+'</h2><button class="icon-button" data-close="config-dialog" aria-label="Đóng sự cố">×</button></div><form id="incident-form" class="management-form">'+areaField('incident-note','Ghi nhận xử lý','','Không tự thay điểm hoặc chạy lại các bài bị ảnh hưởng.',3)+'<div id="incident-validation" class="validation-box" role="status">Bắt buộc ghi chú để truy vết.</div><div class="form-actions"><button class="button primary" type="submit">Xác nhận mô phỏng</button></div></form>';$('#config-dialog').showModal();}
  });
  document.addEventListener('change',event=>{
    if(event.target.id==='management-program'){
      stashManagementForm();state.program=event.target.value;
      if(state.program)state.playgroundId=prompts.find(prompt=>prompt.program===state.program)?.id||'PG-b1';render();
    }
    if(event.target.id==='azure-profile'){stashManagementForm();state.azureId=event.target.value;render();}
    if(event.target.closest('#azure-form')){stashManagementForm();$('#azure-validation').textContent=azureMessage(selectedAzure().working);}
    if(event.target.id==='op-action')updateOperationTarget();
  });
  document.addEventListener('input',event=>{if(event.target.closest('#playground-form')||event.target.closest('#azure-form'))stashManagementForm();});
  document.addEventListener('submit',event=>{
    const form=event.target;if(!['lcms-form','playground-form','azure-form','sla-form','permissions-form','operation-form','incident-form'].includes(form.id))return;
    event.preventDefault();
    if(form.id==='lcms-form'){
      if(!can('lcms'))return;const value=lcmsValues(),issues=validateLcms(value);if(issues.length){$('#lcms-check').textContent=issues.join(' ');return;}
      let entity=configs.find(config=>config.id===state.lcmsEditing);
      if(!entity){entity={...value,id:'LC-'+String(configs.length+1).padStart(3,'0'),version:'Chưa áp dụng',mapping:'',object:'Chưa áp dụng',affected:0,health:'Chưa áp dụng',draft:null};configs.push(entity);}
      entity.draft={...value};logManagement('Lưu nháp cấu hình LCMS',entity.id,'Điều chỉnh liên kết '+value.path+' / '+value.mapping);$('#config-dialog').close();render();notify('Đã lưu bản nháp LCMS. Bản đang áp dụng được giữ nguyên.');
    }
    if(form.id==='playground-form'){
      if(!can('playground'))return;stashManagementForm();const entity=selectedPrompt(),issues=promptIssues(entity.working);if(issues.length){$('#playground-validation').textContent=issues.join(' ');return;}
      entity.draft={...entity.working};logManagement('Lưu nháp AI Playground',entity.id,'Cập nhật prompt / rubric / cấu trúc kết quả');render();notify('Đã lưu bản nháp Playground.');
    }
    if(form.id==='azure-form'){
      const permission=state.azureTab==='fsel'?'fsel':'azure';if(!can(permission))return;
      stashManagementForm();const entity=selectedAzure(),issues=azureIssues(entity.working);
      if(!entity.working.criteria.trim()||!entity.working.rule.trim())issues.push('Bổ sung tiêu chí và quy tắc FSEL.');
      if(issues.length){$('#azure-validation').textContent=issues.join(' ');return;}
      entity.draft={...entity.working};logManagement('Lưu nháp Azure Assessment',entity.id,'Cập nhật nhóm '+(permission==='fsel'?'quy tắc FSEL':'tham số Azure'));render();notify('Đã lưu bản nháp hồ sơ Assessment.');
    }
    if(form.id==='sla-form'){
      if(!can('sla'))return;const value={warning:30,target:Number($('#sla-target').value),ack:Number($('#sla-ack').value),resolve:Number($('#sla-resolve').value),reason:$('#sla-reason').value.trim()};
      if(!value.reason||value.target<=30||value.ack<1||value.resolve<value.ack){$('#sla-validation').textContent='Nhập lý do; mục tiêu chấm phải lớn hơn 30s, hạn khắc phục không ngắn hơn hạn tiếp nhận.';return;}
      slaDraft=value;logManagement('Lưu nháp chính sách SLA','SLA-AI-v2',value.reason);render();notify('Đã lưu nháp SLA. KPI và đồng hồ mẫu vẫn theo chính sách v1.');
    }
    if(form.id==='permissions-form'){
      if(!can('permissions'))return;const reason=$('#permission-reason').value.trim();if(!reason){$('#permissions-validation').textContent='Vui lòng nhập lý do điều chỉnh quyền.';return;}
      const changes=[];for(const role of ['academic','tech','admin'])for(const key of Object.keys(permissionLabels)){const input=form.elements['perm-'+role+'-'+key];if(input.disabled)continue;if(permissions[role][key]!==input.checked){changes.push(roleLabel(role)+' / '+permissionLabels[key]+': '+(input.checked?'cấp':'thu hồi'));permissions[role][key]=input.checked;}}
      if(!changes.length){$('#permissions-validation').textContent='Chưa có thay đổi quyền.';return;}
      logManagement('Điều chỉnh quyền mô phỏng','Ma trận quyền vai trò',reason+' · '+changes.join('; '),'Đã áp dụng trong demo');render();notify('Đã cập nhật quyền trong phiên mô phỏng.');
    }
    if(form.id==='operation-form'){
      if(!can('route'))return;const row=rows.find(item=>item.id===state.operationId),action=$('#op-action').value,reason=$('#op-reason').value.trim(),target=$('#op-target').value;
      if(!reason){$('#operation-validation').textContent='Vui lòng nhập lý do thao tác.';return;}
      if(!routeOptions(row).some(option=>option.id===action))return;
      if(action==='alternate'&&(prompts.find(prompt=>prompt.id===target)?.program!==rowProgram(row)||target===('PG-'+rowProgram(row)))){$('#operation-validation').textContent='Chọn bộ chấm khác bộ gốc và thuộc cùng chương trình của bài.';return;}
      const label=routeOptions(row).find(option=>option.id===action).name;
      if(row.opsAction===label&&row.route===(action==='alternate'?target:action)){ $('#operation-validation').textContent='Yêu cầu tương tự đã được ghi nhận trong phiên mô phỏng; không tạo lặp.';return;}
      row.opsAction=label;row.route=action==='alternate'?target:action;row.opsReason=reason;
      logManagement('Yêu cầu xử lý / chuyển luồng',row.id+' / '+row.question,reason+' · '+label+(action==='alternate'?' / '+target:''),'Đã tạo yêu cầu mô phỏng');$('#config-dialog').close();if($('#detail-dialog').open)$('#detail-content').innerHTML=detailMarkup(row);render();notify('Đã ghi yêu cầu và Audit Log. Chưa chạy AI hoặc thay điểm.');
    }
    if(form.id==='incident-form'){
      if(!can('incident'))return;const incident=incidents.find(item=>item.id===state.incidentId),note=$('#incident-note').value.trim();if(!note){$('#incident-validation').textContent='Vui lòng nhập ghi nhận xử lý.';return;}
      const action=incident.ack?'Ghi nhận khắc phục sự cố':'Tiếp nhận sự cố';if(incident.ack)incident.resolved=clockTime();else incident.ack=clockTime();incident.note=note;logManagement(action,incident.id,note,'Đã ghi nhận mô phỏng');$('#config-dialog').close();render();notify('Đã ghi nhận sự cố và Audit Log.');
    }
  });
  document.addEventListener('keydown',event=>{
    const tab=event.target.closest('[data-management-tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const tabs=[...tab.parentElement.querySelectorAll('[role="tab"]')],index=tabs.indexOf(tab),next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].click();
  });
}
resetManagement();
bindManagementEvents();
bindAiGovernance();

document.querySelectorAll("[data-icon]").forEach(element => element.innerHTML = icon(element.dataset.icon));
$("#type-filter").innerHTML += types.map(type => '<option value="' + type.id + '">' + type.name + (type.planned ? " · " + type.planned : "") + '</option>').join("");
resetAudit();
bindEvents();
render();
setInterval(()=>refreshData(),60000);

