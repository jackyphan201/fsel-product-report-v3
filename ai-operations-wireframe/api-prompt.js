"use strict";

const aiGovernanceLabels = {
  "api-keys": ["API Keys Management", "API Keys", "Quản lý key và liên kết theo Tenant → Subject → Feature."],
  "usage-cost": ["Usage, Cost & Analysis", "Usage & Cost", "Đối chiếu lượt gọi, token, chi phí và cache theo phạm vi sử dụng."],
  "prompt-admin": ["Quản trị Prompt", "Quản trị Prompt", "Quản lý prompt mặc định, prompt theo vị trí, lịch sử gửi và quyền chỉnh sửa."]
};
const govTenants = [{id:"tenant-a",name:"Tenant A · FSEL mẫu"}, {id:"tenant-b",name:"Tenant B · Campus mẫu"}];
const govComponents = {
  content: {name:"Chấm nội dung", provider:"OpenAI", models:["LLM mẫu A","LLM mẫu B"]},
  stt: {name:"Speech-to-Text", provider:"Azure Speech", models:["Speech STT mẫu"]},
  pronunciation: {name:"Pronunciation Assessment", provider:"Azure Speech", models:["Assessment mẫu"]}
};
const govTabs = {
  folders:"Default & Specific Prompt", attachments:"API Key attachments",
  edits:"Prompt Edits", sent:"Prompt đã gửi", users:"User logs",
  cache:"Context & Token Cache", access:"Truy cập & khóa"
};
const govRights = {
  view:"Truy cập feature và xem cấu hình", edit:"Soạn prompt, model và thư mục",
  config:"Sửa Config", schema:"Sửa JSON Schema", payload:"Xem nội dung prompt / kết quả",
  cache:"Quản lý context mẫu"
};
const govDay = 86400000;
const govEnd = Date.UTC(2026,10,6,17);
const govRates = {input:2,cached:0.5,output:8,speech:0.02};
const govCostGroups = [
  {id:"feature",name:"Feature / Component"},
  {id:"model",name:"Model"},
  {id:"provider",name:"Provider"},
  {id:"key",name:"API key"},
  {id:"line",name:"Hạng mục tính phí"}
];
const govCostColors = ["#566CD6","#168278","#B46A23","#8653A5","#BB5273","#51778C","#687835"];
const govCostDate = new Intl.DateTimeFormat("vi-VN",{timeZone:"Asia/Ho_Chi_Minh",day:"2-digit",month:"2-digit"});
const govCostDateLabel = date=>govCostDate.format(date).replace("-","/");
const govLesson = {id:"MAP-CF-007", name:"English B1 / Unit 3 / Lesson 2 / CF-007"};
const govExamples = [
  {id:"EX-01",lesson:"MAP-CF-007",approved:true,excerpt:"The community garden helped neighbors meet.",result:"Nêu rõ lợi ích. Cần thêm ví dụ cụ thể."},
  {id:"EX-02",lesson:"MAP-CF-007",approved:true,excerpt:"Volunteers watered plants every Saturday.",result:"Có chi tiết phù hợp với đề bài."},
  {id:"EX-03",lesson:"MAP-CF-007",approved:false,excerpt:"",result:""},
  {id:"EX-04",lesson:"MAP-CF-099",approved:true,excerpt:"",result:""}
];
let gov;

function aiGovernanceReviewLabel(view) {
  return {"api-keys":"WF-SCR-010 · API Keys", "usage-cost":"WF-SCR-011 · Usage & Cost", "prompt-admin":"WF-SCR-012 · Prompt"}[view] + " · CR-002 · PROPOSED";
}
function resetAiGovernance() {
  gov = {
    tenant:"tenant-a", subject:"Tiếng Anh", feature:"forum", tab:"folders", promptId:"default", component:"content",
    period:7, allFeatures:false, usageKey:"", costGroup:"feature", costDay:null,
    learner:"", keys:[], mappings:{}, prompts:{}, rules:{}, contexts:{}, audit:[], requests:[]
  };
  for (const [index,tenant] of govTenants.entries()) {
    const prefix = index ? "B" : "A";
    const open = prefix + "-OPENAI-01";
    const speech = prefix + "-SPEECH-01";
    gov.keys.push(
      {id:open, tenant:tenant.id, name:"Key chấm nội dung",provider:"OpenAI",version:1,active:true},
      {id:prefix+"-OPENAI-02",tenant:tenant.id,name:"Key dự phòng",provider:"OpenAI",version:1,active:true},
      {id:speech,tenant:tenant.id,name:"Key Azure Speech",provider:"Azure Speech",version:1,active:true}
    );
    for (const feature of ["forum","long","listing","vstep-speaking"]) {
      const scope = [tenant.id,"Tiếng Anh",feature].join("|");
      gov.mappings[scope] = {content:open};
      if (feature === "forum" || feature.endsWith("speaking")) {
        Object.assign(gov.mappings[scope],{stt:speech,pronunciation:speech});
      }
      for (let day=0;day<14;day++) {
        for (let call=0;call<(index ? 1 : 2);call++) {
          const request = {
            id:"REQ-"+(1001+gov.requests.length), tenant:tenant.id, subject:"Tiếng Anh", feature, component:"content",
            time:govEnd-(day+1)*govDay+36000000+call*180000, key:open, keyVersion:1, provider:"OpenAI", model:"LLM mẫu A",
            learner:"HV-MẪU-"+String(call+1).padStart(2,"0"), lesson:feature==="forum"?govLesson.id:"MAP-Q-014",
            prompt:"Default · v1", sent:"Chấm theo rubric của "+govFeatureName(feature)+". Bài mẫu: My answer gives one example.",
            result:"{\n  \"score\": 3,\n  \"feedback\": \"Thêm dẫn chứng cụ thể.\"\n}",
            input:1300+day*18+call*210, cached:call===1&&day%3!==0?1024:0, output:140+day*5, minutes:0,
            failed:call===0&&day%5===0
          };
          if (request.failed) {
            request.output=0;
            request.result="Lỗi mô phỏng · HTTP 429";
          }
          gov.requests.push(request);
        }
        if (feature === "forum") gov.requests.push({
          id:"REQ-"+(1001+gov.requests.length),tenant:tenant.id,subject:"Tiếng Anh",feature,component:"stt",
          time:govEnd-(day+1)*govDay+36100000,key:speech,keyVersion:1,provider:"Azure Speech",model:"Speech STT mẫu",
          learner:"HV-MẪU-01",lesson:govLesson.id,prompt:"Azure STT · v1",sent:"Âm thanh mẫu · en-US",
          result:"Transcript mẫu",input:null,cached:null,output:null,minutes:1.25,failed:false
        });
      }
    }
  }
}
function govFeatureName(feature=gov.feature) { return types.find(type=>type.id===feature)?.name || feature; }
function govScope() { return [gov.tenant,gov.subject,gov.feature].join("|"); }
function govScopeName() { return [govTenants.find(item=>item.id===gov.tenant)?.name,gov.subject,govFeatureName()].join(" / "); }
function govVisibleTenants() { return state.role==="admin" ? govTenants : govTenants.slice(0,1); }
function govEnsureTenant() {
  if (!govVisibleTenants().some(tenant=>tenant.id===gov.tenant)) {
    gov.tenant=govVisibleTenants()[0].id;
    gov.usageKey="";
    gov.promptId="default";
  }
}
function govDefaultRights(role) {
  return {view:true,edit:true,config:role==="tech",schema:role==="tech",payload:true,cache:role==="tech"};
}
function govRoleRights(role) { return gov.rules[govScope()]?.[role] || govDefaultRights(role); }
function govCan(right) {
  if (!govVisibleTenants().some(tenant=>tenant.id===gov.tenant)) return false;
  if (right==="keys" || right==="usage") return state.role==="admin" || state.role==="tech";
  if (right==="access") return state.role==="admin";
  if (right==="payload" && !can("sensitive")) return false;
  if (state.role==="admin") return true;
  const rules=govRoleRights(state.role);
  return rules.view && !!rules[right];
}
function govAudit(action, target, note="", changes=null) {
  gov.audit.unshift({scope:govScope(),time:Date.now(),actor:roleLabel(),action,target,note,changes});
}
function govComponentIds() {
  const feature=gov.feature;
  return feature==="forum" || feature==="practice" || feature==="hskk" || feature.includes("speaking")
    ? Object.keys(govComponents) : ["content"];
}
function govKeys() { return gov.keys.filter(key=>key.tenant===gov.tenant); }
function govMappings() { return gov.mappings[govScope()] || {}; }
function govScopedRequests(allFeatures=false) {
  return gov.requests.filter(row=>{
    if (row.tenant!==gov.tenant || row.subject!==gov.subject || (!allFeatures&&row.feature!==gov.feature)) return false;
    const scope=[row.tenant,row.subject,row.feature].join("|");
    return state.role==="admin" || gov.rules[scope]?.[state.role]?.view!==false;
  });
}
function govCostLineItems(row) {
  if (row.input===null) return [["Azure Speech · Phút âm thanh",row.minutes*govRates.speech]];
  return [
    ["Input thường",(row.input-row.cached)*govRates.input/1e6],
    ["Cached input",row.cached*govRates.cached/1e6],
    ["Output",row.output*govRates.output/1e6]
  ];
}
function govRequestCost(row) { return govCostLineItems(row).reduce((sum,[,amount])=>sum+amount,0); }
function govMoney(value) { return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:4,maximumFractionDigits:4}).format(value); }
function govNumber(value) { return new Intl.NumberFormat("vi-VN",{maximumFractionDigits:2}).format(value); }
function govDate(timestamp) { return new Intl.DateTimeFormat("vi-VN",{timeZone:"Asia/Ho_Chi_Minh",dateStyle:"short",timeStyle:"short"}).format(timestamp); }
function govBtn(label, action, id="", style="secondary", disabled=false) {
  return '<button type="button" class="button '+style+'" data-gov-action="'+action+'" data-gov-id="'+escapeHtml(id)+'"'+(disabled?' disabled':'')+'>'+escapeHtml(label)+'</button>';
}
function govTable(headers, rows, empty="Chưa có dữ liệu trong phạm vi này.") {
  if (!rows.length) return '<p class="table-note">'+escapeHtml(empty)+'</p>';
  return '<div class="table-scroll"><table><thead><tr>'+headers.map(header=>'<th scope="col">'+escapeHtml(header)+'</th>').join("")+
    '</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(cell=>'<td>'+cell+'</td>').join("")+'</tr>').join("")+'</tbody></table></div>';
}
function govPanel(title, caption, content, action="") {
  return '<section class="panel gov-panel"><div class="panel-header"><div><h2>'+title+'</h2><p>'+caption+'</p></div>'+action+'</div>'+content+'</section>';
}
function govToolbar() {
  return '<div class="gov-scope">'+selectField("gov-tenant","Tenant",govVisibleTenants(),gov.tenant)+
    selectField("gov-subject","Subject",languages,gov.subject)+selectField("gov-feature","Feature / Function",types.map(type=>({id:type.id,name:type.name+(type.planned?" · "+type.planned:"")})),gov.feature,"",gov.allFeatures&&state.view==="usage-cost"?"disabled":"")+
    '</div>';
}
function renderAiGovernance() {
  govEnsureTenant();
  const header=govToolbar();
  if (!govCan("view") && state.view==="prompt-admin") return header+emptyMarkup("Feature đã khóa truy cập","Liên hệ Admin tổng để được cấp quyền theo phạm vi.");
  if (state.view==="api-keys") return header+renderGovKeys();
  if (state.view==="usage-cost") return header+renderGovUsage();
  return header+renderGovPrompts();
}
function renderGovKeys() {
  const mapped=govMappings();
  const table=govTable(["Key / bí danh","Provider","Phiên bản","Gắn ở feature đang chọn","Trạng thái","Thao tác"],govKeys().map(key=>[
    '<strong>'+escapeHtml(key.id)+'</strong><small>'+escapeHtml(key.name)+'</small>',key.provider,"v"+key.version,
    (govCan("view")?Object.entries(mapped).filter(([,id])=>id===key.id).map(([component])=>govComponents[component].name).join("<br>"):"")||"—",
    badge(key.active?"Hoạt động":"Tạm khóa",key.active?"success":"warning"),govBtn("Quản lý","key",key.id,"text")
  ]));
  return notice("Danh mục key của Tenant. Liên kết được đặt riêng tại từng Subject → Feature → Component. Demo chỉ quản lý mã key, bí danh và trạng thái.")+
    govPanel("Key trong Tenant","Mỗi lần gọi được đối chiếu bằng mã key và phiên bản tại thời điểm gửi.",table,govBtn("Thêm key mô phỏng","key","new","primary",!govCan("keys")))+
    renderGovAttachments()+govBtn("Xem Usage & Cost →","usage","", "text",!govCan("usage"));
}
function renderGovAttachments() {
  if (!govCan("view")) return "";
  const map=govMappings();
  return govPanel("API Key attachments",escapeHtml(govScopeName()),govTable(["Component","Provider","Key đã gắn","Tình trạng",""],govComponentIds().map(component=>{
    const key=govKeys().find(item=>item.id===map[component]);
    return [govComponents[component].name,govComponents[component].provider,
      key?escapeHtml(key.id)+' · v'+key.version:"—",
      badge(key?(key.active?"Sẵn sàng":"Key tạm khóa"):"Chưa gắn key",key?.active?"success":"warning"),
      govBtn("Đổi liên kết","attach",component,"text",!govCan("keys"))];
  })));
}
function govTotals(rows) {
  return rows.reduce((acc,row)=>{
    acc.calls++;
    acc.failed+=Number(row.failed);
    acc.cost+=govRequestCost(row);
    acc.input+=row.input||0;
    acc.cached+=row.cached||0;
    acc.output+=row.output||0;
    acc.minutes+=row.minutes;
    return acc;
  },{calls:0,failed:0,cost:0,input:0,cached:0,output:0,minutes:0});
}
function govCostParts(row) {
  if (gov.costGroup==="line") return govCostLineItems(row);
  const labels={
    feature:govFeatureName(row.feature)+" · "+govComponents[row.component].name,
    model:row.model,provider:row.provider,key:row.key
  };
  return [[labels[gov.costGroup],govRequestCost(row)]];
}
function govCostBreakdown(rows) {
  const amounts=new Map();
  for (const row of rows) {
    for (const [label,amount] of govCostParts(row)) {
      if (amount>0) amounts.set(label,(amounts.get(label)||0)+amount);
    }
  }
  return amounts;
}
function govCostDetail(dayIndex) {
  const {groups,amounts,days}=gov.costChart;
  const day=dayIndex===null?null:days[dayIndex];
  const values=day?.amounts||amounts;
  const total=[...values.values()].reduce((sum,amount)=>sum+amount,0);
  return '<div class="gov-cost-detail-head"><span class="small muted">'+(day?"Ngày "+govCostDateLabel(day.date):"Cả kỳ báo cáo")+
    '</span><strong>'+govMoney(total)+'</strong></div><ul class="gov-cost-legend">'+groups.map(({label,color})=>
      '<li><span class="gov-cost-swatch" style="--series:'+color+'" aria-hidden="true"></span>'+
      '<span>'+escapeHtml(label)+'</span><b>'+govMoney(values.get(label)||0)+'</b></li>').join("")+'</ul>';
}
function govRenderCostChart(rows,start) {
  const amounts=govCostBreakdown(rows);
  const control=selectField("gov-cost-group","Nhóm chi phí theo",govCostGroups,gov.costGroup);
  if (!amounts.size) return govPanel("Chi phí theo ngày","USD ước tính · múi giờ Việt Nam",
    '<p class="table-note">Chưa có chi phí trong phạm vi lọc.</p>',control);
  const groups=[...amounts.keys()].sort((a,b)=>a.localeCompare(b,"vi")).map((label,index)=>({
    label,color:govCostColors[index%govCostColors.length]
  }));
  const days=Array.from({length:gov.period},(_,index)=>{
    const date=start+index*govDay;
    const values=govCostBreakdown(rows.filter(row=>row.time>=date&&row.time<date+govDay));
    return {date,amounts:values,total:[...values.values()].reduce((sum,value)=>sum+value,0)};
  });
  gov.costChart={groups,amounts,days};
  const peak=Math.max(...days.map(day=>day.total));
  const stepBase=10**Math.floor(Math.log10(peak/4));
  const step=[1,2,2.5,5].map(factor=>factor*stepBase).find(value=>value>=peak/4)||10*stepBase;
  const limit=4*step;
  const lines=Array.from({length:5},(_,index)=>
    '<div class="gov-cost-gridline" style="top:'+index*25+'%"><span>'+govMoney((4-index)*step)+'</span></div>'
  ).join("");
  const columns=days.map(({date,amounts:values,total},index)=>{
    const label=govCostDateLabel(date);
    const segments=groups.filter(group=>values.has(group.label)).map(({label:groupLabel,color})=>
      '<span class="gov-cost-segment" style="height:'+100*values.get(groupLabel)/limit+'%;--series:'+color+'"></span>'
    ).join("");
    return '<button type="button" class="gov-cost-day" data-gov-action="cost-day" data-gov-id="'+index+
      '" aria-pressed="'+(gov.costDay===index)+'" aria-label="Ngày '+label+' · '+govMoney(total)+
      '"><span class="gov-cost-stack" aria-hidden="true">'+segments+'</span><span class="gov-cost-date">'+label+'</span></button>';
  }).join("");
  return govPanel("Chi phí theo ngày","USD ước tính · múi giờ Việt Nam",
    '<div class="gov-cost-layout"><div class="gov-cost-scroll"><div class="gov-cost-plot" style="--days:'+days.length+'"><div aria-hidden="true">'+lines+'</div>'+
    '<div class="gov-cost-days">'+columns+'</div></div></div>'+
    '<aside id="gov-cost-detail" class="gov-cost-detail" aria-label="Chi phí theo nhóm">'+
    '<div class="gov-cost-all">'+govBtn("Cả kỳ","cost-day","","text")+'</div>'+
    '<div id="gov-cost-detail-content">'+govCostDetail(gov.costDay)+'</div></aside></div>'+
    '<p class="table-note">Trỏ hoặc dùng Tab để xem từng ngày. Bấm vào cột để ghim ngày.</p>',control);
}
function govShowCostDay(index) {
  const detail=$("#gov-cost-detail-content");
  if (detail) detail.innerHTML=govCostDetail(index);
}
function govPinCostDay(id) {
  const index=id===""?null:Number(id);
  gov.costDay=gov.costDay===index?null:index;
  document.querySelectorAll(".gov-cost-day").forEach(button=>
    button.setAttribute("aria-pressed",String(Number(button.dataset.govId)===gov.costDay))
  );
  govShowCostDay(gov.costDay);
}
function renderGovUsage() {
  if (!govCan("usage")) return emptyMarkup("Chưa có quyền xem chi phí","Vai trò Tech vận hành hoặc Admin tổng có quyền trong bản mô phỏng.");
  const start=govEnd-gov.period*govDay;
  const scoped=govScopedRequests(gov.allFeatures).filter(row=>!gov.usageKey||row.key===gov.usageKey);
  const current=scoped.filter(row=>row.time>=start && row.time<govEnd);
  const prior=scoped.filter(row=>row.time>=start-gov.period*govDay && row.time<start);
  const total=govTotals(current), previous=govTotals(prior);
  const groups=new Map();
  current.forEach(row=>{
    const key=[row.feature,row.key,row.component].join("|");
    if (!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(row);
  });
  const breakdown=[...groups.values()].map(rows=>({row:rows[0],total:govTotals(rows)})).sort((a,b)=>b.total.cost-a.total.cost);
  const change=previous.cost ? ((total.cost/previous.cost-1)*100).toFixed(1)+"% so với kỳ trước" : "Kỳ trước chưa có chi phí";
  const rate=total.input ? (100*total.cached/total.input).toFixed(1)+"%" : "—";
  const cards=[
    ["Lượt gọi",govNumber(total.calls),govNumber(total.failed)+" lỗi"],
    ["Token gửi / nhận",govNumber(total.input)+" / "+govNumber(total.output),"Chỉ các lượt gọi tính theo token"],
    ["Token cache",govNumber(total.cached),rate+" trên input token"],
    ["Chi phí ước tính",govMoney(total.cost),change]
  ];
  return '<div class="gov-scope">'+selectField("gov-period","Kỳ báo cáo",[{id:"7",name:"7 ngày đến 06/11/2026"},{id:"14",name:"14 ngày đến 06/11/2026"}],String(gov.period))+
    selectField("gov-usage-key","API key",[{id:"",name:"Tất cả key"},...govKeys().map(key=>({id:key.id,name:key.id}))],gov.usageKey)+
    checkField("gov-all-features","Tổng hợp tất cả feature của Subject",gov.allFeatures)+'</div>'+
    '<div class="sla-metrics">'+cards.map(([label,value,caption])=>'<div class="metric"><span class="metric-label">'+label+'</span><strong class="metric-value">'+value+'</strong><span class="metric-foot">'+caption+'</span></div>').join("")+'</div>'+
    govRenderCostChart(current,start)+
    govPanel("Phân tích theo Feature và key","Xếp theo chi phí giảm dần. Lượt gọi lỗi được tính trong số lượt gọi.",govTable(
      ["Feature / Component","Provider / Key","Lượt gọi / lỗi","Input / Cached / Output","Phút âm thanh","Chi phí"],breakdown.map(({row,total:item})=>[
        '<strong>'+escapeHtml(govFeatureName(row.feature))+'</strong><small>'+govComponents[row.component].name+'</small>',
        row.provider+'<small>'+escapeHtml(row.key)+'</small>',item.calls+" / "+item.failed,
        row.input===null?"—":[item.input,item.cached,item.output].map(govNumber).join(" / "),
        item.minutes?govNumber(item.minutes):"—",govMoney(item.cost)
      ])))+
    notice("Đơn giá giả lập. Input thường 2 USD, cached input 0,5 USD và output 8 USD trên mỗi triệu token. Azure Speech mẫu 0,02 USD/phút. Chi phí gồm input thường, cached input, output và số phút. Số liệu để thử phân tích và đối chiếu, chưa kết nối hóa đơn.","warning");
}
function govDefaultPrompt(component) {
  return {
    id:"default",name:"Default prompt",folder:"Mặc định",lesson:"",version:1,component,
    model:govComponents[component].models[0],
    userRole:"Học viên gửi bài tại {{lesson_id}}.",
    system:"Áp dụng rubric của "+govFeatureName()+". Chấm bài hiện tại và giải thích theo tiêu chí.",
    config:'{\n  "max_output_tokens": 400\n}',
    schema:'{\n  "type": "object",\n  "properties": {"score": {"type":"number"}, "feedback": {"type":"string"}},\n  "required": ["score", "feedback"]\n}',
    draft:null
  };
}
function govPromptList() {
  const scope=govScope()+"|"+gov.component;
  if (!gov.prompts[scope]) {
    const base=govDefaultPrompt(gov.component);
    gov.prompts[scope]=[base];
    if (gov.subject==="Tiếng Anh"&&gov.feature==="forum"&&gov.component==="content") gov.prompts[scope].push({
      ...base,id:"specific-01",name:"CF-007 · Phản hồi Speaking",folder:"English B1 / Unit 3 / Lesson 2",
      lesson:govLesson.id,system:"Chấm Class Forum CF-007 theo rubric Speaking. Tách dẫn chứng và góp ý."
    });
  }
  return gov.prompts[scope];
}
function renderGovPrompts() {
  const tabs=Object.entries(govTabs).map(([id,name])=>govBtn(name,"tab",id,gov.tab===id?"primary":"secondary")).join("");
  const bodies={folders:renderGovFolders,attachments:renderGovAttachments,edits:renderGovEdits,
    sent:()=>renderGovLogs(false),users:()=>renderGovLogs(true),cache:renderGovCache,access:renderGovAccess};
  return '<nav class="gov-tabs" aria-label="Mục quản trị Prompt">'+tabs+'</nav>'+bodies[gov.tab]();
}
function renderGovFolders() {
  const prompts=govPromptList();
  const current=prompts.find(item=>item.id===gov.promptId)||prompts[0];
  const value=current.draft||current;
  const folders=new Map();
  prompts.forEach(item=>{
    if (!folders.has(item.folder)) folders.set(item.folder,[]);
    folders.get(item.folder).push(item);
  });
  const items=[...folders].map(([folder,members])=>'<details class="gov-folder" open><summary>'+escapeHtml(folder)+'</summary>'+
    members.map(item=>'<button type="button" class="profile-item '+(current.id===item.id?"selected":"")+'" data-gov-action="prompt" data-gov-id="'+item.id+'"><strong>'+escapeHtml(item.name)+'</strong><small>'+
      (item.lesson?escapeHtml(item.lesson)+" · ":"")+(item.version?"v"+item.version:"Chưa áp dụng")+(item.draft?" · Có bản nháp":"")+'</small></button>').join("")+'</details>').join("");
  const canEdit=govCan("edit");
  return '<div class="gov-scope">'+selectField("gov-component","Component",govComponentIds().map(id=>({id,name:govComponents[id].name})),gov.component)+'</div>'+
    '<div class="configuration-layout">'+govPanel("Thư mục prompt","Mặc định và ghi đè theo vị trí",items+govBtn("Thêm prompt theo vị trí","new-prompt","","text",!canEdit))+
    govPanel(escapeHtml(current.name),escapeHtml(current.folder+(current.lesson?" / "+current.lesson:"")), '<form id="gov-prompt-form" class="management-form">'+
    '<div class="form-grid">'+field("gov-current-component","Component",govComponents[gov.component].name,"","readonly")+
    selectField("gov-model","Model chosen",govComponents[gov.component].models,value.model,"",canEdit?"":"disabled")+'</div>'+
    '<fieldset '+(canEdit?"":"disabled")+'>'+areaField("gov-user-role","User role · nội dung message",value.userRole,"Tách với quyền Admin / Tech / Academic.",2)+
    areaField("gov-system","System role / Prompt",value.system,"",4)+'</fieldset>'+
    '<div class="form-grid gov-json"><fieldset '+(govCan("config")&&canEdit?"":"disabled")+'>'+areaField("gov-config","Config",value.config,govCan("config")?"JSON object":"Đã khóa sửa cho vai trò này",5)+'</fieldset>'+
    '<fieldset '+(govCan("schema")&&canEdit?"":"disabled")+'>'+areaField("gov-schema","JSON Schema",value.schema,govCan("schema")?"JSON object":"Đã khóa sửa cho vai trò này",5)+'</fieldset></div>'+
    '<p class="small muted" id="gov-feedback" role="status">Bản đang dùng '+(current.version?"v"+current.version:"chưa có")+' · Prompt cụ thể đã áp dụng ưu tiên khi khớp đúng MappingId, sau đó dùng Default.</p>'+
    '<div class="form-actions">'+govBtn("Xem prompt hiệu lực","resolve","", "secondary",!govCan("payload"))+'<button class="button primary" '+(canEdit?"":"disabled")+'>Lưu bản nháp</button></div></form>',
    badge(current.draft?"Có bản nháp":"Bản hiện hành",current.draft?"brand":"neutral"))+'</div>';
}
function renderGovEdits() {
  const sample=govScopedRequests().at(-1);
  const events=gov.audit.filter(event=>event.scope===govScope());
  const rows=events.map((event,index)=>[
    govDate(event.time),escapeHtml(event.actor),escapeHtml(event.action),escapeHtml(event.target),
    escapeHtml(event.note),event.changes?govBtn("Xem thay đổi","diff",String(index),"text",!govCan("payload")):"—"
  ]);
  if (sample) rows.push([govDate(sample.time),"Tech vận hành","Truy cập prompt","Default · v1","Lịch sử mẫu","—"]);
  return govPanel("Prompt Edits & lịch sử truy cập","Theo dõi phiên bản, nội dung thay đổi, người truy cập và thời điểm.",govTable(["Thời điểm","Vai trò","Sự kiện","Đối tượng","Chi tiết",""],rows));
}
function renderGovLogs(byUser) {
  const scoped=govScopedRequests();
  const learners=[...new Set(scoped.map(row=>row.learner))].sort();
  const filter=byUser?'<div class="gov-pad">'+selectField("gov-learner","Người học mẫu",[{id:"",name:"Tất cả người học"},...learners],gov.learner)+'</div>':"";
  const sorted=scoped.filter(row=>!byUser||!gov.learner||row.learner===gov.learner).sort((a,b)=>b.time-a.time);
  return govPanel(byUser?"User logs":"Prompt đã gửi",byUser?"Prompt/token gửi và kết quả/token nhận theo người học mẫu.":"Lưu bản ghi request kèm phiên bản prompt, key và vị trí bài.",filter+govTable(
    ["Thời điểm / Request","User / vị trí bài","Prompt / Model","Key lúc gửi","Token gửi / Cache / Nhận","Kết quả",""],sorted.map(row=>[
      govDate(row.time)+'<small>'+row.id+'</small>',escapeHtml(row.learner)+'<small>'+row.lesson+'</small>',
      escapeHtml(row.prompt)+'<small>'+escapeHtml(row.model)+'</small>',escapeHtml(row.key)+' · v'+row.keyVersion,
      row.input===null?"— · "+govNumber(row.minutes)+" phút":[row.input,row.cached,row.output].map(govNumber).join(" / "),
      badge(row.failed?"Lỗi":"Hoàn tất",row.failed?"error":"success"),
      govBtn("Xem request","request",row.id,"text",!govCan("payload"))
    ])));
}
function govContextKey() { return govScope()+"|"+govLesson.id; }
function govContext() { return gov.contexts[govContextKey()]||{enabled:false,ids:[]}; }
function govEligibleExample(example) { return gov.tenant==="tenant-a"&&gov.subject==="Tiếng Anh"&&gov.feature==="forum"&&example.approved&&example.lesson===govLesson.id; }
function renderGovCache() {
  const current=govContext();
  const requests=govScopedRequests();
  const total=govTotals(requests);
  const tokenCalls=requests.filter(row=>row.input!==null).length;
  const hits=requests.filter(row=>row.cached>0).length;
  const hasExamples=gov.tenant==="tenant-a"&&gov.subject==="Tiếng Anh"&&gov.feature==="forum";
  return govPanel("Token cache do provider báo cáo","Số liệu request mẫu trong 14 ngày, tách riêng khỏi thư viện bài mẫu.",
    '<div class="gov-pad"><p>'+govNumber(hits)+' / '+govNumber(tokenCalls)+' request tính token có cache hit · '+govNumber(total.cached)+' cached input tokens</p>'+
    '<p class="small muted">Chênh lệch phí input theo đơn giá mẫu: '+govMoney(total.cached*(govRates.input-govRates.cached)/1e6)+
    ' so với tính toàn bộ input theo giá thường. Số này chỉ phản ánh cache hit trong log mẫu.</p>'+
    '<p class="small muted">Cache hit phụ thuộc prefix và cấu hình request tương thích. Ví dụ bổ sung làm tăng input và thay đổi prefix có thể làm thay đổi khả năng tái sử dụng cache.</p></div>')+
    govPanel("Thư viện bài mẫu cùng vị trí","Dùng trích đoạn ẩn danh và nhận xét theo rubric đã duyệt làm ngữ cảnh.",hasExamples?
    '<form id="gov-cache-form" class="management-form"><p class="small muted">'+govLesson.name+' · '+govLesson.id+'</p>'+
    '<fieldset '+(govCan("cache")?"":"disabled")+'>'+checkField("gov-context-enabled","Cho phép đưa bài mẫu đã duyệt vào ngữ cảnh",current.enabled)+'</fieldset>'+
    govTable(["Mẫu","Phạm vi / điều kiện","Nội dung & kết quả đã duyệt","Dùng"],govExamples.map(example=>[
      example.id,example.lesson+'<small>'+(govEligibleExample(example)?"Cùng vị trí · Đã duyệt":example.approved?"Khác vị trí":"Chưa duyệt")+'</small>',
      govEligibleExample(example)&&govCan("payload")?escapeHtml(example.excerpt)+'<small>'+escapeHtml(example.result)+'</small>':"—",
      '<input class="gov-checkbox" type="checkbox" name="gov-example" value="'+example.id+'" aria-label="Dùng '+example.id+'" '+(current.ids.includes(example.id)?"checked ":"")+(govCan("cache")&&govEligibleExample(example)?"":"disabled")+'>'
    ]))+'<p class="small muted" id="gov-feedback" role="status">Tối đa 2 bài mẫu mỗi vị trí trong demo. Có thể xem thứ tự ghép prompt trước khi lưu.</p><div class="form-actions">'+
    govBtn("Xem ngữ cảnh ghép","context-preview","","secondary",!govCan("payload"))+'<button class="button primary" '+(govCan("cache")?"":"disabled")+'>Lưu thiết lập</button></div></form>'
    :'<p class="table-note">Chưa có bài mẫu được duyệt cho Tenant / Subject / Feature này.</p>');
}
function renderGovAccess() {
  const editable=govCan("access");
  return govPanel("Quyền theo Tenant / Subject / Feature",escapeHtml(govScopeName()),
    '<form id="gov-access-form" class="management-form">'+notice("Admin tổng quản lý phạm vi. Academic mặc định bị khóa sửa Config và JSON Schema. Quyền payload cũng cần quyền xem dữ liệu chấm trong ma trận chung.")+
    govTable(["Quyền","Tech vận hành","Academic"],Object.entries(govRights).map(([id,label])=>[
      escapeHtml(label),...["tech","academic"].map(role=>'<input class="gov-checkbox" type="checkbox" name="'+role+'-'+id+'" aria-label="'+escapeHtml(label+" · "+roleLabel(role))+'" '+(govRoleRights(role)[id]?"checked ":"")+(editable?"":"disabled")+'>')
    ]))+(editable?field("gov-access-reason","Lý do","", "", "required"):"")+
    '<p id="gov-feedback" role="status" class="small muted"></p><div class="form-actions"><button class="button primary" '+(editable?"":"disabled")+'>Lưu phân quyền mô phỏng</button></div></form>');
}
function govDialog(title, caption, body) {
  $("#config-dialog-content").innerHTML='<div class="dialog-heading"><div><h2 id="config-title">'+title+'</h2><p>'+caption+
    '</p></div><button class="icon-button" data-close="config-dialog" aria-label="Đóng">×</button></div><div class="gov-dialog-body">'+body+'</div>';
  $("#config-dialog").showModal();
}
function govForm(id, body, label, editable=true) {
  return '<form id="'+id+'" class="management-form"><fieldset '+(editable?"":"disabled")+'>'+body+
    '</fieldset><p class="small muted" id="gov-dialog-feedback" role="status"></p><div class="form-actions"><button class="button primary" '+(editable?"":"disabled")+'>'+label+'</button></div></form>';
}
function govOpenKey(id) {
  const key=govKeys().find(item=>item.id===id);
  if ((!key&&id!=="new")||(!key&&!govCan("keys"))) return;
  const actions=key?[{id:"rename",name:"Cập nhật bí danh"},{id:"rotate",name:"Đổi phiên bản key (mô phỏng)"},{id:"toggle",name:key.active?"Tạm khóa key":"Mở lại key"}]:[];
  const body=field("gov-key-alias","Bí danh key",key?.name||"","","required maxlength=\"80\"")+
    selectField("gov-key-provider","Provider",["OpenAI","Azure Speech"],key?.provider||"OpenAI","",key?"disabled":"")+
    (key?selectField("gov-key-operation","Thao tác",actions,"rename"):"")+
    field("gov-key-reason","Lý do","","","required")+
    '<input type="hidden" name="keyId" value="'+escapeHtml(id)+'">';
  govDialog(key?escapeHtml(key.id)+" · v"+key.version:"Thêm API key mô phỏng",escapeHtml(govTenants.find(item=>item.id===gov.tenant).name)+
    " · "+(key?govAttachmentCount(key.id)+" liên kết trong Tenant":"Bí danh và provider"),
    govForm("gov-key-form",body,"Lưu thay đổi mô phỏng",govCan("keys")));
}
function govAttachmentCount(id) {
  return Object.entries(gov.mappings).filter(([scope])=>scope.startsWith(gov.tenant+"|")).reduce((sum,[,map])=>sum+Object.values(map).filter(key=>key===id).length,0);
}
function govOpenAttachment(component) {
  if (!govCan("keys")||!govCan("view")||!govComponentIds().includes(component)) return;
  const provider=govComponents[component].provider;
  const eligible=govKeys().filter(key=>key.active&&key.provider===provider).map(key=>({id:key.id,name:key.id+" · "+key.name}));
  const existing=govMappings()[component]||"";
  const optionsList=[{id:"",name:"Gỡ / chưa gắn key"},...eligible];
  if (existing&&!eligible.some(key=>key.id===existing)) optionsList.push({id:existing,name:existing+" · Key tạm khóa"});
  govDialog("Gắn API key · "+govComponents[component].name,escapeHtml(govScopeName()),
    govForm("gov-attachment-form",selectField("gov-attach-key","Key",optionsList,existing,"Danh sách giới hạn theo Tenant, provider và trạng thái key.")+
      field("gov-attach-reason","Lý do","","","required")+'<input type="hidden" name="component" value="'+component+'">',"Lưu liên kết mô phỏng"));
}
function govOpenNewPrompt() {
  if (!govCan("edit")) return;
  govDialog("Thêm prompt theo vị trí",escapeHtml(govScopeName()+" / "+govComponents[gov.component].name),govForm("gov-folder-form",
    field("gov-folder-name","Thư mục","English B1 / Unit 3 / Lesson 2","Dùng đường dẫn thư mục để nhóm prompt.","required maxlength=\"120\"")+
    field("gov-prompt-name","Tên prompt","","","required maxlength=\"80\"")+
    field("gov-prompt-lesson","MappingId","","Một vị trí chỉ có một prompt cụ thể trong component này.","required maxlength=\"80\""),"Tạo bản nháp"));
}
function govOpenRequest(id) {
  if (!govCan("payload")) return;
  const row=govScopedRequests().find(item=>item.id===id);
  if (!row) return;
  govAudit("Truy cập request",row.id,"Đã mở nội dung prompt và kết quả mẫu");
  const blocks=[["Prompt đã gửi",row.sent],["Kết quả nhận",row.result]];
  govDialog(row.id+" · "+escapeHtml(row.prompt),escapeHtml(govScopeName()+" / "+row.lesson),
    '<div class="gov-pad"><p class="small muted">'+escapeHtml(row.learner+" · "+row.key+" v"+row.keyVersion+" · "+govDate(row.time))+'</p>'+
    '<p class="small muted">'+(row.input===null?govNumber(row.minutes)+" phút âm thanh":"Token gửi "+govNumber(row.input)+" · Cache "+govNumber(row.cached)+" · Token nhận "+govNumber(row.output))+
    ' · Chi phí '+govMoney(govRequestCost(row))+'</p>'+blocks.map(([label,value])=>'<h3>'+label+'</h3><pre class="code-preview">'+escapeHtml(value)+'</pre>').join("")+'</div>');
}
function govOpenDiff(id) {
  if (!govCan("payload")) return;
  const event=gov.audit.filter(item=>item.scope===govScope())[Number(id)];
  if (!event?.changes) return;
  govAudit("Truy cập phiên bản prompt",event.target,"Đã mở nội dung thay đổi");
  govDialog("So sánh bản nháp",escapeHtml(event.target),
    '<div class="gov-pad">'+event.changes.map(({name,before,after})=>'<h3>'+escapeHtml(name)+'</h3><div class="form-grid"><div><small>Trước</small><pre class="code-preview">'+escapeHtml(before)+'</pre></div><div><small>Sau</small><pre class="code-preview">'+escapeHtml(after)+'</pre></div></div>').join("")+'</div>');
}
function govEffectivePrompt(lesson) {
  const prompts=govPromptList();
  return prompts.find(item=>item.version>0&&item.lesson===lesson&&item.id!=="default")||prompts[0];
}
function govEffectiveMarkup(lesson) {
  const prompt=govEffectivePrompt(lesson);
  const key=govKeys().find(item=>item.id===govMappings()[gov.component]);
  const keyStatus=key?key.id+" · v"+key.version+(key.active?"":" · Tạm khóa"):"Chưa gắn API key";
  return '<p class="small muted">'+escapeHtml(prompt.name+" · v"+prompt.version+" · "+prompt.model+" · "+keyStatus)+'</p>'+
    '<pre class="code-preview">'+escapeHtml(prompt.system)+'</pre>';
}
function govOpenResolution() {
  if (!govCan("payload")) return;
  const selected=govPromptList().find(item=>item.id===gov.promptId);
  const lesson=selected?.lesson||govLesson.id;
  govAudit("Truy cập prompt hiệu lực",govEffectivePrompt(lesson).name,"Kiểm tra MappingId "+lesson);
  govDialog("Prompt hiệu lực",escapeHtml(govScopeName()),
    '<div class="gov-pad">'+field("gov-resolve-lesson","Thử MappingId",lesson,"Áp dụng bản hiện hành theo vị trí. Bản nháp chờ review.")+
    govBtn("Kiểm tra MappingId","resolve-check","","text")+'<div id="gov-resolution" aria-live="polite">'+govEffectiveMarkup(lesson)+'</div></div>');
}
function govReadContext(form) {
  const enabled=form.elements["gov-context-enabled"].checked;
  const ids=new FormData(form).getAll("gov-example").filter(id=>govExamples.some(item=>item.id===id&&govEligibleExample(item)));
  return {enabled,ids};
}
function govOpenContextPreview() {
  if (!govCan("payload")) return;
  const context=govCan("cache")?govReadContext($("#gov-cache-form")):govContext();
  const examples=context.enabled?govExamples.filter(example=>govEligibleExample(example)&&context.ids.includes(example.id)):[];
  const prefix=["Rubric và hướng dẫn cố định của CF-007",...examples.map(example=>example.id+": "+example.excerpt+" | Nhận xét: "+example.result)];
  govAudit("Truy cập ngữ cảnh mẫu",govLesson.id,"Xem trước ghép context");
  govDialog("Xem ngữ cảnh ghép",escapeHtml(govScopeName()+" / "+govLesson.id),
    '<div class="gov-pad"><h3>Phần cố định · '+examples.length+' bài mẫu</h3><pre class="code-preview">'+escapeHtml(prefix.join("\n"))+
    '</pre><h3>Phần thay đổi theo lượt nộp</h3><pre class="code-preview">{{bai_lam_hien_tai}}</pre><p class="small muted">Xem cấu trúc mô phỏng. Số token và cache hit được ghi nhận từ request khi triển khai.</p></div>');
}
function govSetFeedback(form, message) {
  form.querySelector('[role="status"]').textContent=message;
}
function govRequired(values) { return values.every(value=>typeof value==="string"&&value.trim()); }
function govJsonObject(value) {
  try {
    const result=JSON.parse(value);
    return !!result&&typeof result==="object"&&!Array.isArray(result);
  } catch { return false; }
}
function govSaveKey(form, data) {
  if (!govCan("keys")) return false;
  const alias=data.get("gov-key-alias"), reason=data.get("gov-key-reason");
  if (!govRequired([alias,reason])) { govSetFeedback(form,"Nhập bí danh và lý do."); return false; }
  const id=data.get("keyId");
  if (id==="new") {
    const provider=data.get("gov-key-provider");
    if (!["OpenAI","Azure Speech"].includes(provider)) return false;
    const serial=govKeys().length+1;
    const key={id:(gov.tenant==="tenant-a"?"A":"B")+"-DEMO-"+serial,tenant:gov.tenant,name:alias.trim(),provider,version:1,active:true};
    gov.keys.push(key);
    govAudit("Thêm API key",key.id,reason.trim());
    return true;
  }
  const key=govKeys().find(item=>item.id===id);
  if (!key) return false;
  const action=data.get("gov-key-operation");
  if (action==="rotate") {
    key.version++;
    govAudit("Đổi phiên bản key",id+" · v"+key.version,reason.trim());
  } else if (action==="toggle") {
    key.active=!key.active;
    govAudit(key.active?"Mở lại key":"Tạm khóa key",id,reason.trim()+" · "+govAttachmentCount(id)+" liên kết");
  } else {
    key.name=alias.trim();
    govAudit("Sửa bí danh key",id,reason.trim());
  }
  return true;
}
function govSaveAttachment(form, data) {
  if (!govCan("keys")||!govCan("view")) return false;
  const component=data.get("component"), id=data.get("gov-attach-key"), reason=data.get("gov-attach-reason");
  if (!govComponentIds().includes(component)||!govRequired([reason])) return false;
  const key=govKeys().find(item=>item.id===id&&item.active&&item.provider===govComponents[component].provider);
  if (id&&!key) { govSetFeedback(form,"Chọn key hoạt động, đúng Tenant và đúng provider."); return false; }
  const map=gov.mappings[govScope()] ||= {};
  const before=map[component]||"Chưa gắn";
  if (id) map[component]=id;
  else delete map[component];
  govAudit("Cập nhật API Key attachment",govComponents[component].name,before+" → "+(id||"Đã gỡ")+" · "+reason.trim());
  return true;
}
function govSaveFolder(form, data) {
  if (!govCan("edit")) return false;
  const name=data.get("gov-prompt-name"), folder=data.get("gov-folder-name"), lesson=data.get("gov-prompt-lesson");
  if (!govRequired([name,folder,lesson])) return false;
  const prompts=govPromptList();
  if (prompts.some(item=>item.lesson===lesson.trim())) { govSetFeedback(form,"Vị trí này đã có prompt trong component."); return false; }
  const item={...govDefaultPrompt(gov.component),id:"specific-"+String(prompts.length).padStart(2,"0"),name:name.trim(),folder:folder.trim(),lesson:lesson.trim(),version:0};
  item.draft={model:item.model,userRole:item.userRole,system:item.system,config:item.config,schema:item.schema};
  prompts.push(item);
  gov.promptId=item.id;
  govAudit("Tạo prompt theo vị trí",item.name,item.folder+" / "+item.lesson);
  return true;
}
function govSavePrompt(form, data) {
  if (!govCan("edit")) return false;
  const prompt=govPromptList().find(item=>item.id===gov.promptId);
  if (!prompt) return false;
  const previous=prompt.draft||prompt;
  const next={model:data.get("gov-model"),userRole:data.get("gov-user-role"),system:data.get("gov-system"),
    config:govCan("config")?data.get("gov-config"):previous.config,
    schema:govCan("schema")?data.get("gov-schema"):previous.schema};
  if (!govRequired([next.userRole,next.system])||!govComponents[gov.component].models.includes(next.model)) {
    govSetFeedback(form,"Nhập model, User role và System role."); return false;
  }
  if (!govJsonObject(next.config)||!govJsonObject(next.schema)) { govSetFeedback(form,"Config và JSON Schema cần là JSON object hợp lệ."); return false; }
  const changes=Object.entries(next).filter(([key,value])=>previous[key]!==value).map(([name,after])=>({name,before:previous[name],after}));
  if (!changes.length) { govSetFeedback(form,"Chưa có thay đổi để lưu."); return false; }
  prompt.draft=next;
  govAudit("Lưu bản nháp prompt",prompt.name,"So với "+(previous===prompt?"bản hiện hành v"+prompt.version:"bản nháp trước"),changes);
  return true;
}
function govSaveContext(form) {
  if (!govCan("cache")||!govExamples.some(govEligibleExample)) return false;
  const context=govReadContext(form);
  if (context.enabled&&!context.ids.length) { govSetFeedback(form,"Chọn ít nhất một bài mẫu đã duyệt hoặc tắt tái sử dụng."); return false; }
  gov.contexts[govContextKey()]=context;
  govAudit("Cập nhật tái sử dụng ngữ cảnh",govLesson.id,context.enabled?"Bật · "+context.ids.join(", "):"Tắt");
  return true;
}
function govSaveAccess(form, data) {
  if (!govCan("access")) return false;
  const reason=data.get("gov-access-reason");
  if (!govRequired([reason])) return false;
  const next={};
  const changes=[];
  for (const role of ["tech","academic"]) {
    const previous=govRoleRights(role);
    next[role]={};
    for (const [right,label] of Object.entries(govRights)) {
      const enabled=data.has(role+"-"+right);
      next[role][right]=enabled;
      if (previous[right]!==enabled) changes.push({name:roleLabel(role)+" / "+label,before:previous[right]?"Cho phép":"Khóa",after:enabled?"Cho phép":"Khóa"});
    }
  }
  if (!changes.length) { govSetFeedback(form,"Chưa có thay đổi quyền."); return false; }
  gov.rules[govScope()]=next;
  govAudit("Cập nhật quyền feature",govScopeName(),reason.trim(),changes);
  return true;
}
function govResetSelection() { gov.promptId="default"; gov.component="content"; gov.learner=""; }
function bindAiGovernance() {
  const commands={
    key:govOpenKey,attach:govOpenAttachment,usage:()=>navigate("usage-cost"),
    "cost-day":govPinCostDay,
    tab:id=>{if (Object.hasOwn(govTabs,id)) { gov.tab=id; render(); }},
    prompt:id=>{
      const item=govPromptList().find(prompt=>prompt.id===id);
      if (!item||!govCan("view")) return;
      gov.promptId=id; govAudit("Truy cập prompt",item.name,item.version?"v"+item.version:"Bản nháp"); render();
    },
    "new-prompt":govOpenNewPrompt,resolve:govOpenResolution,diff:govOpenDiff,request:govOpenRequest,"context-preview":govOpenContextPreview,
    "resolve-check":()=>{
      if (!govCan("payload")) return;
      const lesson=$("#gov-resolve-lesson").value.trim();
      govAudit("Truy cập prompt hiệu lực",govEffectivePrompt(lesson).name,"Kiểm tra MappingId "+lesson);
      $("#gov-resolution").innerHTML=govEffectiveMarkup(lesson);
    }
  };
  document.addEventListener("click",event=>{
    const button=event.target.closest("[data-gov-action]");
    if (button&&!button.disabled) commands[button.dataset.govAction]?.(button.dataset.govId);
  });
  for (const eventName of ["pointerover","pointerout","focusin","focusout"]) {
    document.addEventListener(eventName,event=>{
      const column=event.target.closest(".gov-cost-day");
      if (!column || column.contains(event.relatedTarget)) return;
      const entering=eventName==="pointerover"||eventName==="focusin";
      govShowCostDay(entering?Number(column.dataset.govId):gov.costDay);
    });
  }
  const selectors={
    "gov-tenant":input=>{if(govVisibleTenants().some(tenant=>tenant.id===input.value)){gov.tenant=input.value;gov.usageKey="";govResetSelection();}},
    "gov-subject":input=>{gov.subject=input.value;govResetSelection();},
    "gov-feature":input=>{gov.feature=input.value;govResetSelection();},
    "gov-component":input=>{gov.component=input.value;gov.promptId="default";},
    "gov-period":input=>{gov.period=Number(input.value);},
    "gov-usage-key":input=>{gov.usageKey=input.value;},
    "gov-all-features":input=>{gov.allFeatures=input.checked;},
    "gov-cost-group":input=>{gov.costGroup=input.value;},
    "gov-learner":input=>{gov.learner=input.value;}
  };
  document.addEventListener("change",event=>{
    const handler=selectors[event.target.id];
    if (handler) {
      const id=event.target.id;
      if (state.view==="usage-cost") gov.costDay=null;
      handler(event.target);
      render();
      if (id==="gov-cost-group") $("#gov-cost-group")?.focus();
    }
  });
  const forms={
    "gov-key-form":govSaveKey,"gov-attachment-form":govSaveAttachment,"gov-folder-form":govSaveFolder,
    "gov-prompt-form":govSavePrompt,"gov-cache-form":govSaveContext,"gov-access-form":govSaveAccess
  };
  document.addEventListener("submit",event=>{
    const save=forms[event.target.id];
    if (!save) return;
    event.preventDefault();
    if (save(event.target,new FormData(event.target))) {
      if ($("#config-dialog").open) $("#config-dialog").close();
      render();
      notify("Đã lưu thay đổi mô phỏng và ghi lịch sử.");
    }
  });
}
