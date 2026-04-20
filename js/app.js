
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


    function updateChart(cash, stock, pledge, lend, fut) {
        const ctx = document.getElementById('assetChart').getContext('2d');
        const data = [cash, stock+ pledge+ lend, fut];
        const labels = ['現金', '總持股', '期貨權益'];

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
                        backgroundColor: ['#2ecc71', '#3498db',  '#e67e22'],//'#f1c40f', '#9b59b6',
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
	
	
