
var loadingPic = 'images/01c0c0aaf0b2648db5.png';

var unitListTemplate = `<div class="unitlistdiv">
    <div class="oneunitdiv" v-for="(oneunit, index) in unitdata" :key="oneunit.name + oneunit.id" :index="index" :style="'background: ' + (oneunit.selected ? '#AFA;' : 'rgba(0, 0, 0, 0)')">
        <div class="oneunittitlediv">
            <span v-text="oneunit.name"></span>
        </div>
        <div class="input-group oneunitdetaildiv">
            <!--input id="inputid" type="text" class="form-control"-->
            <div class="chosendiv">
                <img :src="oneunit.classwithicon[oneunit.selectedclassid][1]">
                <span v-text="oneunit.classwithicon[oneunit.selectedclassid][0]"></span>
            </div>
            <div class="buttondiv">
                <div class="costdiv">
                    <a href="javascript:void(0);" :bindwheel="'#wheel' + index" class="wheel-button" v-text="oneunit.selectedcost"></a>
                    <ul :id="'wheel' + index">
                        <li class="item" v-for="c in oneunit.cost"><a href="javascript:void(0)" v-text="c"></a></li>
                    </ul>
                </div>
                <div style="height: calc(100% - 60px); border: solid 0px black;"></div>
                <div class="input-group-btn">
                    <button type="button" class="btn btn-default dropdown-toggle unit-class-toggle" data-toggle="dropdown">
                        <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu pull-right unit-class-list">
                        <li class="dropdownli" v-for="icondatas in oneunit.classwithicon">
                            <a href="javascript:void(0);"><img :src="icondatas[1]"><span>{{ icondatas[0] }}</span></a></li>
                        </li>
                    </ul>
                </div>
                <!--add empty div to remove dropdown-toggle button 'left-radius:0px' css-->
                <div></div>
            </div>
        </div>
    </div>
    <div v-if="unitdata.length == 0" style="display: flex; flex-direction: column; width: 100%">
        <div style="display: flex; justify-content: center; flex: none;">
            <span style="margin: 10px; flex: none; font-size: 30px; font-weight: bold;">
                没有符合要求的单位！
            </span>
        </div>
    </div>
</div>`;

var dropdownToggleTemplate = `<div>
    <span class="buttontitle">{{ title }}</span>
    <div class="btn-group">
        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown"><span>{{ chosenindex == undefined ? texts[0] : texts[chosenindex] }}</span> <span class="caret"></span></button>
        <ul class="dropdown-menu" role="menu">
            <li v-for="(text, index) in texts"><a href="javascript:void(0)" :index="index" @click="liClick($event)">{{ text }}</a></li>
        </ul>
    </div>
</div>`;

var randomResultTemplate = `<div style="display: flex; flex-direction: row; flex-wrap: wrap;">
    <div v-for="oneunit in unitdata" style="width: 15%; margin: 10px 2.5%">
        <img style="width: 100%" :src="oneunit.classwithicon[oneunit.selectedclassid][1]" :title="oneunit.name">
    </div>
    <div v-if="unitdata == undefined || unitdata.length == 0" class="alert alert-danger">未能在10000次随机生成满足要求的随机结果！请检查随机条件是否存在矛盾，或者降低要求以增加随机成功率。</div>
</div>`;

var checkboxListTemplate = `<div style="display: flex; flex-direction: row; flex-wrap: wrap;">
    <div v-for="(text, index) in texts" :style="' width: ' + 100.0 / texts.length + '%; margin: 10px 0px;'">
        <div style="display: flex; justify-content: center;">
            <input type="checkbox" :id="randomId[index]" :index="index" v-model="selects[index]">
            <label :for="randomId[index]">{{ text }}</label>
        </div>
    </div>
</div>`;

Vue.component('unitlist', {
    template: unitListTemplate,
    props: [ 'unitdata' ]
});

Vue.component('customdropdown', {
    template: dropdownToggleTemplate,
    props: [ 'texts', 'title', 'chosenindex' ],
    methods: {
        liClick: function(e) {
            var a = e.currentTarget;
            var index = parseInt($(a).attr('index'));
            this.$emit('update:chosenindex', index);
        }
    }
});

Vue.component('randomresult', {
    template: randomResultTemplate,
    props: [ 'unitdata' ]
});

Vue.component('checkboxlist', {
   template: checkboxListTemplate,
   props: [ 'texts', 'selects' ],
   data: function() {
       var a = [];
       for (var j = 0; j < this.texts.length; j ++ ){
           var r = 'CheckboxRandomId';
           for (var i = 0; i < 10; i ++ )
               r += String.fromCharCode(65 + getRandomInt(0, 26));
           a.push(r);
       }
       return {
           randomId: a
       };
   }
});

//replace <unitlist> under el
function addUnitList(el, data){
    $(el).html(`<unitlist :unitdata="${ data }"></unitlist>`);
}

//click dropdown list event, update selectedclassid
function dropdownLiAFunc(thisa, vueunitdata) {
    var oud = $($(thisa).parents('.oneunitdiv')[0]);
    var id = parseInt(oud.attr('index'));
    for (var i = 0; i < bodyVue[vueunitdata][id].classwithicon.length; i ++ )
        if (bodyVue[vueunitdata][id].classwithicon[i][0] == $(thisa).text())
            bodyVue[vueunitdata][id].selectedclassid = i;
    unitDataCostUpdate(bodyVue[vueunitdata][id]);
    unitDataChange(bodyVue[vueunitdata][id]);
}

var unitData = []; //full unitdata array
var badyVue; // root Vue instance

//load unitlist.json
function loadDataJson(path){
    $.getJSON(path).done(function (data){
        for (var name in data){
            //if (data.rare == 7) console.log(data);
            var i = unitData.length;
            unitData[i] = {};
            unitData[i]['name'] = name;
            unitData[i]['id'] = 0;
            for (var j in data[name])
                unitData[i][j] = data[name][j];
            //if (unitdata.length > 10) break;
        }

        for (var i = 0; i < unitData.length; i ++ ){
            for (var j = 0; j < unitData[i].classwithicon.length; j ++ ){
                r = /^.*?image(\d+).*?([^\\\/]*)$/;
                len = unitData[i].classwithicon[j].length;
                if (len == 1)
                    unitData[i].classwithicon[j][1] = loadingPic;
                var imgsrc = unitData[i].classwithicon[j][1];
                if (r.test(imgsrc))
                    unitData[i].classwithicon[j][1] = 'images/' + r.exec(imgsrc)[1] + r.exec(imgsrc)[2];
                if (j > 0 && unitData[i].classwithicon[j][1] == loadingPic)
                    unitData[i].classwithicon[j][1] = unitData[i].classwithicon[j - 1][1];
            }
            unitData[i]['selectedclassid'] = 0;
            unitData[i]['selected'] = false;
            unitDataCostUpdate(unitData[i]);
        }
        loadLocalData();
        console.log('data load ok');
        $('#initbutton').text('载入完成，点击进入');
        $('#initbutton').attr('disabled', false);
        if ($('#notwelcome').prop('checked'))
            $('#initbutton').click();
    });
}

//update cost array when unitdata.selectedclassid updated
function unitDataCostUpdate(data) {
    var selectid = data.selectedclassid;
    data['cost'] = [];
    if (selectid != undefined && data.classwithicon.length > selectid && data.status[data.classwithicon[selectid][0]] != undefined){
        for (var j = data.status[data.classwithicon[selectid][0]][2]; j <= data.status[data.classwithicon[selectid][0]][1]; j ++ )
            data.cost.push(j.toString());
    }
    else{
        data.cost.push('?');
        console.log('get cost failed: ', data.name);
    }
    data['selectedcost'] = data.cost[0];
}

//load saved data in localStorage
function loadLocalData() {
    var nowlength = unitData.length;
    for (var i = 0; i < nowlength; i ++ ){
        if (localStorage[unitData[i].name] != undefined){
            console.log('get data', unitData[i].name);
            var localdata = JSON.parse(localStorage[unitData[i].name]);
            for (var j = 0; j < localdata.length; j ++ )
                if (localdata[j].id == 0){
                    unitData[i].selected = true;
                    unitData[i].selectedclassid = localdata[j].classid == undefined ? 0 : localdata[j].classid;
                    unitDataCostUpdate(unitData[i]);
                    if (localdata[j].cost != undefined)
                        unitData[i].selectedcost = localdata[j].cost;
                }
            //TODO 复制人数据加载
        }
    }
}

//load new unitdata to bodyVue.unitdata and bind events, run mounted when done.
function unitDataLoad(el, vueunitdata, unitdata, mounted = () => {} ) {
    bodyVue[vueunitdata] = unitdata;
    bodyVue.$nextTick(function () {
        $(el + ' .dropdownli a').click(function () { dropdownLiAFunc(this, vueunitdata); });
        $(el + ' .wheel-button').wheelmenu({ animation: "fade", animationSpeed: "fast", angle: "all", trigger: "hover" });
        $(el + ' .wheel li a').click(function () {
            var id = $($(this).parents('.oneunitdiv')[0]).attr('index');
            bodyVue[vueunitdata][id].selectedcost = $(this).text();
            unitDataChange(bodyVue[vueunitdata][id]);
        });
        $(el + ' .wheel').click(function () {
            $(this).mouseleave();
        });
        $(el + ' .oneunittitlediv, ' + el + ' .chosendiv').click(function () {
            var id = $($(this).parents('.oneunitdiv')[0]).attr('index');
            bodyVue[vueunitdata][id].selected = !bodyVue[vueunitdata][id].selected;
            unitDataChange(bodyVue[vueunitdata][id]);
        });
        changeUnitClassListWidth();
        mounted();
    });
}

//when unitdata change, update it into localStorage
function unitDataChange(oneunit) {
    if (localStorage[oneunit.name] != undefined && !oneunit.selected){
        var localdata = JSON.parse(localStorage[oneunit.name]);
        for (var i = 0; i < localdata.length; i ++ )
            if (localdata[i].id == oneunit.id){
                localdata.splice(i, 1);
                break;
            }
        if (localdata.length == 0)
            localStorage.removeItem(oneunit.name);
        else
            localStorage[oneunit.name] = JSON.stringify(localdata);
        return;
    }
    if (oneunit.selected){
        savedata = { cost: oneunit.selectedcost, classid: oneunit.selectedclassid, id: oneunit.id };
        var localdata;
        if (localStorage[oneunit.name] == undefined)
            localdata = [];
        else
            localdata = JSON.parse(localStorage[oneunit.name]);
        var index = 0;
        for (; index < localdata.length; index ++ )
            if (localdata[index].id == oneunit.id)
                break;
        if (index < localdata.length)
            localdata[index] = savedata;
        else
            localdata.push(savedata);
        localStorage[oneunit.name] = JSON.stringify(localdata);
    }
}

//compare function for sort
function unitSortCompare(a, b) {
    var chosen = bodyVue.navi.sortArray[bodyVue.navi.sortSelected]
    if (chosen == '名称') return a.name.localeCompare(b.name);
    if (chosen == '稀有度'){
        if (a.rare > b.rare) return -1;
        if (a.rare == b.rare) return 0;
        return 1;
    }
    //TODO 读取职业顺序表排序
    if (chosen == '职业') return a.position.localeCompare(b.position);
    var an = a.selectedcost, bn = b.selectedcost;
    if (an == '?' && bn == '?') return 0;
    if (an == '?') return 1;
    if (bn == '?') return -1;
    an = parseInt(an);
    bn = parseInt(bn);
    if (an < bn) return -1;
    if (an == bn) return 0;
    return 1;
}


//[min, max)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

var rareToNumber = { '蓝': 7, '黑': 6, '白': 5, '金': 4, '银': 3, '铜': 2, '铁': 1 };

//check one unitdata whether pass navi filter
function checkOneUnitNavi(unit) {
    var chosen = bodyVue.navi.rareArray[bodyVue.navi.rareSelected];
    if (rareToNumber[chosen] != undefined && unit.rare != rareToNumber[chosen]) return false;
    chosen = bodyVue.navi.positionArray[bodyVue.navi.positionSelected];
    if (chosen == '近战' && unit.position != 'close') return false;
    if (chosen == '远程' && unit.position != 'far') return false;
    chosen = bodyVue.navi.chosenArray[bodyVue.navi.chosenSelected];
    if (chosen == '已选' && !unit.selected) return false;
    if (chosen == '未选' && unit.selected) return false;
    chosen = bodyVue.navi.costArray[bodyVue.navi.costSelected];
    if (chosen == undefined) chosen = '';
    if (chosen[0] == '低' && (unit.selectedcost == '?' || unit.selectedcost > 15)) return false;
    if (chosen[0] == '中' && (unit.selectedcost == '?' || unit.selectedcost < 16 || unit.selectedcost > 25)) return false;
    if (chosen[0] == '高' && unit.selectedcost != '?' && unit.selectedcost < 26) return false;
    chosen = bodyVue.navi.searchText;
    if (RegExp(chosen).exec(unit.name) == undefined) return false;
    return true;
}

//check one unitdata whether pass random filter
function checkOneUnitRandom(unit) {
    if (!unit.selected) return false;
    return true;
}

//if include rule contains this unit, return true
function includeCheck(unit) {
    if (!bodyVue.random.include.enabled) return true;
    if (!bodyVue.random.include.rareSelected[unit.rare - 1]) return false;
    if (unit.position == 'close' && !bodyVue.random.include.positionSelected[0]) return false;
    if (unit.position == 'far' && !bodyVue.random.include.positionSelected[1]) return false;
    return true;
}

//if exclude rule contains this unit, return true (not a legal unit)
function excludeCheck(unit) {
    if (!bodyVue.random.exclude.enabled) return false;
    if (bodyVue.random.exclude.rareSelected[unit.rare - 1]) return true;
    if (unit.position == 'close' && bodyVue.random.exclude.positionSelected[0]) return true;
    if (unit.position == 'far' && bodyVue.random.exclude.positionSelected[1]) return true;
    return false;
}

// use random.include/exclude to find all legal units
function getLegalUnits(inunitlist) {
    var res = [];
    for (var unit in inunitlist)
        if (includeCheck(inunitlist[unit]) && !excludeCheck(inunitlist[unit]))
            res.push(inunitlist[unit]);
    return res;
}

//use units in unitlist and generate unitlist pass random filter
function makeLegalUnitList(inunitlist, number = 15) {
    var unitlist = getLegalUnits(inunitlist);
    for (var randomcount = 0; randomcount < 10000; randomcount ++ ){
        var nowres = [];
        for (var j = 0; j < number; j ++ ){
            var rndpos = getRandomInt(j, unitlist.length);
            var tmp = unitlist[j];
            unitlist[j] = unitlist[rndpos];
            unitlist[rndpos] = tmp;
            nowres.push(unitlist[j]);
        }
        var closenum = 0, totcost = 0, costnum = 0;
        for (var i in nowres){
            if (nowres[i].position == 'close') closenum ++ ;
            if (!isNaN(parseInt(nowres[i].selectedcost))){
                costnum ++ ;
                totcost += parseInt(nowres[i].selectedcost);
            }
        }
        var farnum = number - closenum;
        var chosen = bodyVue.random.rule.closeNumber.min;
        var closemin = parseInt(chosen);
        chosen = bodyVue.random.rule.closeNumber.max;
        var closemax = parseInt(chosen);
        chosen = bodyVue.random.rule.farNumber.min;
        var farmin = parseInt(chosen);
        chosen = bodyVue.random.rule.farNumber.max;
        var farmax = parseInt(chosen);
        chosen = bodyVue.random.rule.averageCost.min;
        var costavgmin = parseInt(chosen);
        chosen = bodyVue.random.rule.averageCost.max;
        var costavgmax = parseInt(chosen);
        //console.log(closenum, farnum, totcost, costnum, closemin, closemax, farmin, farmax, costavgmin, costavgmax);
        if (closenum < closemin || closenum > closemax) continue;
        if (farnum < farmin || farnum > farmax) continue;
        totcost /= 1.0 * costnum;
        if (totcost < costavgmin || totcost > costavgmax) continue;
        return nowres;
    }
    return undefined;
}

//generate new unitlist use filter and order. if israndom15, randomly choose at most 15 unit and sort
function generateUnitList() {
    var showData = [];
    for (var i = 0; i < unitData.length; i ++ )
        if (checkOneUnitNavi(unitData[i]))
            showData.push(unitData[i]);
    showData = showData.sort(unitSortCompare);
    return showData;
}

//generate random unitlist
function generateRandomUnitList() {
    var showData = [];
    for (var i = 0; i < unitData.length; i ++ )
        if (checkOneUnitRandom(unitData[i]))
            showData.push(unitData[i]);
    showData = makeLegalUnitList(showData);
    return showData;
}

function randomUnitListUpdate(vueunitdata) {
    var res = generateRandomUnitList();
    bodyVue[vueunitdata] = res;
    if (res == undefined || res.length == 0) return false;
    return true;
}

//update unitlist with filter, make animation
var unitlListUpdating = false;
function unitListUpdate(el) {
    if (unitlListUpdating) return;
    unitlListUpdating = true;
    $('html,body').animate({ scrollTop: 0 }, 333);
    $('#unitlistdiv').animate({ opacity: '0' }, 333, function () {
        bodyVue.showwelcome = false;
        var showData = generateUnitList();
        /*
        if (vue == undefined){
            addUnitList(el, 'unitdata');
            vue = new Vue({ el: el, data: { unitdata: [] } });
        }
        */
        unitDataLoad(el, 'unitlistunitdata', showData, () => {
            $(el).animate({ opacity: '0' }, showData.length * 2);
            $(el).animate({ opacity: '1' }, 333);
        });
        unitlListUpdating = false;
    });
}

//adjust .unit-class-list width
function changeUnitClassListWidth(){
    $('.unit-class-list').css('width', $('.chosendiv').css('width'));
}

//adjust .unit-class-list width when window size changed
$(document).ready(function () {$(window).resize(changeUnitClassListWidth);});