// 切換手動/自動模式
function toggleManualMode() {
    const isManual = document.getElementById('manual_mode').checked;
    // 隱藏或禁用細項按鈕
    document.querySelectorAll('.sub-item').forEach(btn => btn.disabled = isManual);
    calc();
}

function calc() {
	// 1. 取得數值
	const c_cen = parseFloat(document.getElementById('cash_central').value) || 0;
	let c_oth = 0; document.querySelectorAll('#cash_list .val').forEach(i => c_oth += parseFloat(i.value)||0);
	const total_cash = c_cen + c_oth;

	//const s_total = parseFloat(document.getElementById('stock_total').value) || 0;
	const s_2x = parseFloat(document.getElementById('stock_2x').value) || 0;
	
	let p_a = 0, p_d = 0;
	document.querySelectorAll('#pledge_list .row').forEach(r => {
		p_a += parseFloat(r.querySelector('.p_a').value)||0;//質押抵押市值
		p_d += parseFloat(r.querySelector('.p_d').value)||0;//質押借款
	});

	let total_loan = 0;//總信貸、理財型房貸
	document.querySelectorAll('#loan_list .row').forEach(r => {
		total_loan += parseFloat(r.querySelector('.loan_v').value)||0;//	
	});

	let l_a = 0; document.querySelectorAll('#lend_list .l_v').forEach(i => l_a += parseFloat(i.value)||0);
	let loan_d = 0; document.querySelectorAll('#loan_list .loan_v').forEach(i => loan_d += parseFloat(i.value)||0);
	let total_debt = p_d + total_loan;//總借貸(質押借款)
	
	const f_n = parseFloat(document.getElementById('fut_notional').value) || 0;
	const f_e = parseFloat(document.getElementById('fut_equity').value) || 0;

	// 計算複委託資產
	let foreign_a = 0;
	document.querySelectorAll('#foreign_list .row').forEach(r => {
		const val = parseFloat(r.querySelector('.f_val').value) || 0;
		
		foreign_a += val;      // 直接計入台幣
		
	});

	const isManual = document.getElementById('manual_mode').checked;
    let s_total = 0;

    if (isManual) {
        // 手動模式：直接讀取主欄位
        s_total = parseFloat(document.getElementById('stock_total').value) || 0;
    } else {
        // 自動模式：加總 集保 + 質押品市值(p_a) + 出借市值(l_a) + 複委託(foreign_a)
        const base_stock = parseFloat(document.getElementById('stock_total').value) || 0;
        s_total = base_stock + p_a + l_a + foreign_a; 
    }
	
	// 2. 核心邏輯
	// 總資產 = 現金 + 集保總持股(已含正二) + 質押品市值 + 出借市值 + 期貨權益數
	// 總資產：加入複委託資產 (foreign_a)
	const total_asset = total_cash + s_total + f_e; 
    const total_exp = s_total + s_2x + f_n; // 正二額外加 1 次 [cite: 66, 113]
	
	//淨資產= 總投資 - 總負債 + 現金
	const net_worth = total_asset - total_debt + total_cash;
	
	// 總曝險 = 集保總持股 + 額外加計1次正二 + 質押品市值 + 出借市值 + 期貨名目價值
	//const total_exp = s_total + s_2x + p_a + l_a + f_n + foreign_a;

	// --- 新增：負債比計算 ---
    let debtRatio = total_asset > 0 ? (total_debt / total_asset) * 100 : 0;

	// 3. 更新介面
	document.getElementById('res_total').innerText = Math.round(total_asset-total_cash) + " 萬";//總投資(不含現金)
	document.getElementById('res_loan').innerText = Math.round(total_debt) + " 萬";
	
	document.getElementById('res_net').innerText = Math.round(net_worth) + " 萬";
	document.getElementById('res_exp').innerText = Math.round(total_exp) + " 萬";

	// 更新負債比數值與顏色
    const ratioEl = document.getElementById('res_loanRetio');
    const statusEl = document.getElementById('ratio_status');
    ratioEl.innerText = debtRatio.toFixed(1) + "%";
    
    if (debtRatio > 60) {
        ratioEl.style.color = "#e74c3c"; // 紅色
        statusEl.innerText = "(極高)";
        statusEl.style.color = "#e74c3c";
    } else if (debtRatio > 40) {
        ratioEl.style.color = "#f39c12"; // 橘色
        statusEl.innerText = "(注意)";
        statusEl.style.color = "#f39c12";
    } else {
        ratioEl.style.color = "#2ecc71"; // 綠色
        statusEl.innerText = "(安全)";
        statusEl.style.color = "#2ecc71";
    }
	//document.getElementById('res_2x_pct').innerText = net_worth > 0 ? ((s_2x / net_worth) * 100).toFixed(1) + "%" : "0%";
	document.getElementById('res_2x_pct_total').innerText = total_asset > 0 ? ((s_2x / total_asset) * 100).toFixed(1) + "%" : "0%";
	document.getElementById('res_lev').innerText = net_worth > 0 ? (total_exp / net_worth).toFixed(2) : "0.00";

	updateChart(total_cash, s_total, p_a, l_a, f_e);
	save();

	// 4. 壓力測試模擬邏輯
    const simPct = parseFloat(document.getElementById('sim_range').value) || 0;
    document.getElementById('sim_pct_text').innerText = (simPct > 0 ? "+" : "") + simPct;

    // 模擬淨值變化 = 總曝險 * 漲跌幅 %
    // 因為總曝險已包含：集保(含正二)、正二額外1次、質押品、出借、期貨名目價值 
    const simNetChange = total_exp * (simPct / 100);
    const simNetTotal = net_worth + simNetChange;

    // 更新介面顯示
    const changeEl = document.getElementById('sim_net_change');
    changeEl.innerText = (simNetChange > 0 ? "+" : "") + Math.round(simNetChange);
    changeEl.style.color = simNetChange >= 0 ? "#e74c3c" : "#27ae60"; // 漲顯紅(損益變動), 跌顯綠

    document.getElementById('sim_net_total').innerText = Math.round(simNetTotal);

    // 5. 質押維持率預警模擬 
    let  = "";
    document.querySelectorAll('#pledge_list .row').forEach((r, index) => {
        const pledgeValue = parseFloat(r.querySelector('.p_a').value) || 0;
        const loanAmount = parseFloat(r.querySelector('.p_d').value) || 0;
        const broker = r.querySelector('.p_n').value || `項目 ${index + 1}`;

        if (loanAmount > 0) {
            // 模擬後的維持率 = (原始市值 * (1 + 漲跌幅%)) / 借款金額
            const simRatio = ((pledgeValue * (1 + simPct / 100)) / loanAmount) * 100;
            
            if (simRatio < 135) { // 接近 130% 追繳紅線 [cite: 5, 8]
                //warningHTML += `<div style="color: #e74c3c;">🚨 ${broker} 預估維持率降至 ${simRatio.toFixed(1)}% (危險)</div>`;
            }
        }
    });
    
    //document.getElementById('sim_warning').innerHTML =  || `<div style="color: #27ae60;">✅ 模擬情境下暫無追繳風險</div>`;
}
