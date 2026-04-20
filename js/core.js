
function calc() {
	// 1. 取得數值
	const c_cen = parseFloat(document.getElementById('cash_central').value) || 0;
	let c_oth = 0; document.querySelectorAll('#cash_list .val').forEach(i => c_oth += parseFloat(i.value)||0);
	const total_cash = c_cen + c_oth;

	const s_total = parseFloat(document.getElementById('stock_total').value) || 0;
	const s_2x = parseFloat(document.getElementById('stock_2x').value) || 0;
	
	let p_a = 0, p_d = 0;
	document.querySelectorAll('#pledge_list .row').forEach(r => {
		p_a += parseFloat(r.querySelector('.p_a').value)||0;
		p_d += parseFloat(r.querySelector('.p_d').value)||0;
	});

	let l_a = 0; document.querySelectorAll('#lend_list .l_v').forEach(i => l_a += parseFloat(i.value)||0);
	let loan_d = 0; document.querySelectorAll('#loan_list .loan_v').forEach(i => loan_d += parseFloat(i.value)||0);
	
	const f_n = parseFloat(document.getElementById('fut_notional').value) || 0;
	const f_e = parseFloat(document.getElementById('fut_equity').value) || 0;

	// 計算複委託資產
	let foreign_a = 0;
	document.querySelectorAll('#foreign_list .row').forEach(r => {
		const val = parseFloat(r.querySelector('.f_val').value) || 0;
		
		foreign_a += val;      // 直接計入台幣
		
	});
	// 2. 核心邏輯
	// 總資產 = 現金 + 集保總持股(已含正二) + 質押品市值 + 出借市值 + 期貨權益數
	// 總資產：加入複委託資產 (foreign_a)
	const total_asset = total_cash + s_total + p_a + l_a + f_e + foreign_a;
	const total_debt = p_d + loan_d;
	const net_worth = total_asset - total_debt;
	
	// 總曝險 = 集保總持股 + 額外加計1次正二 + 質押品市值 + 出借市值 + 期貨名目價值
	const total_exp = s_total + s_2x + p_a + l_a + f_n + foreign_a;
	

	// 3. 更新介面
	document.getElementById('res_total').innerText = Math.round(total_asset) + " 萬";
	document.getElementById('res_loan').innerText = Math.round(total_debt) + " 萬";
	
	document.getElementById('res_net').innerText = Math.round(net_worth) + " 萬";
	document.getElementById('res_exp').innerText = Math.round(total_exp) + " 萬";
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
