;(function(win){
	/**
	 * [arrayCompare 按对象index属性值排序函数]
	 */
	var arrayCompare = function(a,b){
		var index1 = a.index;
		var index2 = b.index;
		if(index1 > index2) {
			return 1
		}else if(index1 < index2){
			return -1
		}else{
			return 0;
		}
	};
	/**
	 * [Filter 对象过滤器]
	 * @param {[Object]} opts [{value:'helloworld',data:[{class: "cur", gid: "0", text: "二狗子", val: "3"}],key:'text'}]
	 */
	var Filter = win.Filter = function(opts){
		opts.key = opts.key || 'text';//默认为text关键字排序
		this.value = opts.value;
		this.data = opts.data;
		this.sensitive = opts.sensitive;
		this.key = opts.key;
		this.isString = false;
		
		return this.sortDataByText();
	};
	
	Filter.prototype.sortDataByText = function (){
		var value = this.value;
		var data = this.data;
		var arr = [];
		var sortedArr = [];
		var index = -1;
		for(var i=0,len = data.length; i< len; i++){
			if(this.sensitive){
				//大小写不敏感
				index = data[i][this.key].indexOf(value);
			}else{
				index = data[i][this.key].toLowerCase().indexOf(value.toLowerCase());
			}
			if(index !== -1){
				var o = {};
				o.index = index;
				o.item = data[i];
				arr.push(o);
			}
		}
		arr.sort(arrayCompare);
		if(arr.length > 0){
			for(i in arr){
				if(arr[i].item){sortedArr.push(arr[i].item);}
			}
		}
		return sortedArr;
	};

	Filter.sort = function(opts){
		return new Filter(opts);
	};
})(window);