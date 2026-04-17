
    let myChart;

    // 初始化動態監聽
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('watch') || e.target.tagName === 'INPUT') {
            calc();
        }
    });

    function addItem(type, data = {}) {
        const container = document.getElementById(`${type}_list`);
        const div = document.createElement('div');
        div.className = 'row';
        
        if (type === 'cash') {
            div.innerHTML = `<input type="text" placeholder="銀行" value="${data.n||''}"> 
                            <input type="number" placeholder="金額" class="val" value="${data.v||''}"> 
                            <button class="btn-del" onclick="this.parentElement.remove(); calc();">X</button>`;
        } else if (type === 'pledge') {
            div.innerHTML = `<input type="text" placeholder="券商" class="p_n" value="${data.n||''}">
                            <input type="number" placeholder="借款" class="p_d" value="${data.v1||''}">
                            <input type="number" placeholder="維持率%" class="p_r" value="${data.v2||''}">
                            <input type="number" placeholder="抵押市值" class="p_a" value="${data.v3||''}">
                            <button class="btn-tool" onclick="calcP(this)">換算</button>
                            <button class="btn-del" onclick="this.parentElement.remove(); calc();">X</button>`;
        } else if (type === 'lend') {
            div.innerHTML = `<input type="text" placeholder="代碼" class="l_code" style="flex:0.6" value="${data.c||''}">
                            <input type="number" placeholder="張數" class="l_qty" style="flex:0.6" value="${data.q||''}">
                            <input type="number" placeholder="單價" class="l_prc" style="flex:0.6" value="${data.p||''}">
                            <input type="number" placeholder="市值" class="l_v" value="${data.v||''}">
                            <button class="btn-del" onclick="this.parentElement.remove(); calc();">X</button>`;
            div.querySelectorAll('input').forEach(i => i.addEventListener('input', () => autoCalcLend(div)));
        } else if (type === 'loan') {
            div.innerHTML = `<input type="text" placeholder="貸款說明" value="${data.n||''}">
                            <input type="number" placeholder="剩餘本金" class="loan_v" value="${data.v||''}">
                            <button class="btn-del" onclick="this.parentElement.remove(); calc();">X</button>`;
        }// 在 addItem 函數的 if-else 邏輯中加入
		else if (type === 'foreign') {
		    div.innerHTML = `
		        <input type="text" placeholder="券商/帳戶" style="flex:0.6" value="${data.n||''}">
		        
		        <input type="number" placeholder="金額(台幣)" class="f_val" value="${data.v||''}">		        
		        <button class="btn-del" onclick="this.parentElement.remove(); calc();">X</button>
		    `;
		   
		}
        container.appendChild(div);
        calc();
    }

    function calcP(btn) {
        const row = btn.parentElement;
        const d = parseFloat(row.querySelector('.p_d').value);
        const r = parseFloat(row.querySelector('.p_r').value);
        if (d && r) {
            row.querySelector('.p_a').value = Math.round((d * r) / 100);
            calc();
        }
    }

    function autoCalcLend(row) {
        const q = parseFloat(row.querySelector('.l_qty').value);
        const p = parseFloat(row.querySelector('.l_prc').value);
        if (q && p) {
            row.querySelector('.l_v').value = (q * p * 1000 / 10000).toFixed(1);
            calc();
        }
    }

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
    }

    function updateChart(cash, stock, pledge, lend, fut) {
        const ctx = document.getElementById('assetChart').getContext('2d');
        const data = [cash, stock, pledge, lend, fut];
        const labels = ['現金', '集保股票', '質押標的', '出借部位', '期貨權益'];

        if (myChart) {
            myChart.data.datasets[0].data = data;
            myChart.update();
        } else {
            myChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: ['#2ecc71', '#3498db', '#f1c40f', '#9b59b6', '#e67e22'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { position: 'bottom', labels: { boxWidth: 12 } },
                        title: { display: true, text: '資產配置分布' }
                    }
                }
            });
        }
    }

    function save() { 
        const store = {
            c_c: document.getElementById('cash_central').value,
            s_t: document.getElementById('stock_total').value,
            s_2: document.getElementById('stock_2x').value,
            f_n: document.getElementById('fut_notional').value,
            f_e: document.getElementById('fut_equity').value,
			
            cashes: [], pledges: [], lends: [], loans: [],foreigns: []     
   };
        document.querySelectorAll('#cash_list .row').forEach(r => store.cashes.push({n:r.children[0].value, v:r.children[1].value}));
        document.querySelectorAll('#pledge_list .row').forEach(r => store.pledges.push({n:r.querySelector('.p_n').value, v1:r.querySelector('.p_d').value, v2:r.querySelector('.p_r').value, v3:r.querySelector('.p_a').value}));
        document.querySelectorAll('#lend_list .row').forEach(r => store.lends.push({c:r.querySelector('.l_code').value, q:r.querySelector('.l_qty').value, p:r.querySelector('.l_prc').value, v:r.querySelector('.l_v').value}));
        document.querySelectorAll('#loan_list .row').forEach(r => store.loans.push({n:r.children[0].value, v:r.children[1].value}));
		document.querySelectorAll('#foreign_list .row').forEach(r => {
        store.foreigns.push({
            n: r.children[0].value, 
            v: r.querySelector('.f_val').value
        });
    });
		
        localStorage.setItem('inv_dashboard_v3', JSON.stringify(store));
    }

    window.onload = () => {
        const saved = JSON.parse(localStorage.getItem('inv_dashboard_v3') || '{}');
        if(saved.c_c !== undefined) {
            document.getElementById('cash_central').value = saved.c_c;
            document.getElementById('stock_total').value = saved.s_t;
            document.getElementById('stock_2x').value = saved.s_2;
            document.getElementById('fut_notional').value = saved.f_n;
            document.getElementById('fut_equity').value = saved.f_e;
            saved.cashes.forEach(d => addItem('cash', d));
            saved.pledges.forEach(d => addItem('pledge', d));
            saved.lends.forEach(d => addItem('lend', d));
            saved.loans.forEach(d => addItem('loan', d));
// 新增：讀取並渲染複委託列表
        if (saved.foreigns) {
            saved.foreigns.forEach(d => addItem('foreign', d));
        }

        }
        calc();
    };
	
	
