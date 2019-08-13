let filterSetting = {fines: true, module: false, loi: true};
localStorage.removeItem('filter-settings');
localStorage.setItem('filter-settings', filterSetting);
