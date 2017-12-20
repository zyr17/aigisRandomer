
var loadingpic = 'http://t.zyr17.cn/static/images/aigis/01c0c0aaf0b2648db5.png';

//one unitlist block template
var unitlisttemplate = `<div class="unitlistdiv">
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

//replace <unitlist> under el
function addunitlist(el, data){
    $(el).html(`<unitlist :unitdata="${ data }"></unitlist>`);
}

//click dropdown list event, update selectedclassid
function dropdownliafunc(thisa, vue) {
    var oud = $($(thisa).parents('.oneunitdiv')[0]);
    var id = parseInt(oud.attr('index'));
    for (var i = 0; i < vue.unitdata[id].classwithicon.length; i ++ )
        if (vue.unitdata[id].classwithicon[i][0] == $(thisa).text())
            vue.unitdata[id].selectedclassid = i;
    unitdatacostupdate(vue.unitdata[id]);
    unitdatachange(vue.unitdata[id]);
}

//register unitlist Vue component
Vue.component('unitlist', {
    template: unitlisttemplate,
    props: [ 'unitdata' ]
});

var unitdata = []; //full unitdata array
var showdata = []; //temp array for unitdatas that will show
var unitlistvue; //unitlist Vue instance

//load unitlist.json
function loaddataJSON(path){
    $.getJSON(path).done(function (data){
        for (var name in data){
            if (data.rare == 7) console.log(data);
            var i = unitdata.length;
            unitdata[i] = {};
            unitdata[i]['name'] = name;
            unitdata[i]['id'] = 0;
            for (var j in data[name])
                unitdata[i][j] = data[name][j];
            //if (unitdata.length > 10) break;
        }

        for (var i = 0; i < unitdata.length; i ++ ){
            for (var j = 0; j < unitdata[i].classwithicon.length; j ++ ){
                r = /^.*?image(\d+).*?([^\\\/]*)$/;
                len = unitdata[i].classwithicon[j].length;
                if (len == 1)
                    unitdata[i].classwithicon[j][1] = loadingpic;
                imgsrc = unitdata[i].classwithicon[j][1];
                if (r.test(imgsrc))
                    unitdata[i].classwithicon[j][1] = 'http://t.zyr17.cn/static/images/aigis/' + r.exec(imgsrc)[1] + r.exec(imgsrc)[2];
                if (j > 0 && unitdata[i].classwithicon[j][1] == loadingpic)
                    unitdata[i].classwithicon[j][1] = unitdata[i].classwithicon[j - 1][1];
            }
            unitdata[i]['selectedclassid'] = 0;
            unitdata[i]['selected'] = false;
            unitdatacostupdate(unitdata[i]);
        }
        loadlocaldata();
        console.log('data load ok');
        $('#initbutton').text('载入完成，点击进入');
        $('#initbutton').attr('disabled', false);
        if ($('#notwelcome').prop('checked'))
            $('#initbutton').click();
    });
}

//update cost array when unitdata.selectedclassid updated
function unitdatacostupdate(data) {
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
function loadlocaldata() {
    var nowlength = unitdata.length;
    for (var i = 0; i < nowlength; i ++ ){
        if (localStorage[unitdata[i].name] != undefined){
            console.log('get data', unitdata[i].name);
            var localdata = JSON.parse(localStorage[unitdata[i].name]);
            for (var j = 0; j < localdata.length; j ++ )
                if (localdata[j].id == 0){
                    unitdata[i].selected = true;
                    unitdata[i].selectedclassid = localdata[j].classid == undefined ? 0 : localdata[j].classid;
                    unitdatacostupdate(unitdata[i]);
                    if (localdata[j].cost != undefined)
                        unitdata[i].selectedcost = localdata[j].cost;
                }
            //TODO 复制人数据加载
        }
    }
}

//load new unitdata to vue.unitdata and bind events, run mounted when done.
function unitdataload(el, vue, unitdata, mounted = () => {} ) {
    vue.unitdata = unitdata;
    vue.$nextTick(function () {
        $(el + ' .dropdownli a').click(function () { dropdownliafunc(this, vue); });
        $(el + ' .wheel-button').wheelmenu({ animation: "fade", animationSpeed: "fast", angle: "all", trigger: "hover" });
        $(el + ' .wheel li a').click(function () {
            var id = $($(this).parents('.oneunitdiv')[0]).attr('index');
            vue.unitdata[id].selectedcost = $(this).text();
            unitdatachange(vue.unitdata[id]);
        });
        $(el + ' .wheel').click(function () {
            $(this).mouseleave();
        });
        $(el + ' .oneunittitlediv, ' + el + ' .chosendiv').click(function () {
            var id = $($(this).parents('.oneunitdiv')[0]).attr('index');
            vue.unitdata[id].selected = !vue.unitdata[id].selected;
            unitdatachange(vue.unitdata[id]);
        });
        changeunitclasslistwidth();
        mounted();
    });
    return vue;
}

//when unitdata change, update it into localStorage
function unitdatachange(oneunit) {
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
function unitsortcompare(a, b) {
    var chosen = $('#navidiv #sortdiv button .navichosen').text();
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
function getrandomint(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}


//check one unitdata whether pass filter
function checkoneunit(unit) {
    var chosen = $('#navidiv #rarediv button .navichosen').text();
    if (chosen == '蓝' && unit.rare != 7) return false;
    if (chosen == '黑' && unit.rare != 6) return false;
    if (chosen == '白' && unit.rare != 5) return false;
    if (chosen == '金' && unit.rare != 4) return false;
    if (chosen == '银' && unit.rare != 3) return false;
    if (chosen == '铜' && unit.rare != 2) return false;
    if (chosen == '铁' && unit.rare != 1) return false;
    chosen = $('#navidiv #positiondiv button .navichosen').text();
    if (chosen == '近战' && unit.position != 'close') return false;
    if (chosen == '远程' && unit.position != 'far') return false;
    chosen = $('#navidiv #chosendiv button .navichosen').text();
    if (chosen == '已选' && !unit.selected) return false;
    if (chosen == '未选' && unit.selected) return false;
    chosen = $('#navidiv #costdiv button .navichosen').text();
    if (chosen[0] == '低' && (unit.selectedcost == '?' || unit.selectedcost > 15)) return false;
    if (chosen[0] == '中' && (unit.selectedcost == '?' || unit.selectedcost < 16 || unit.selectedcost > 25)) return false;
    if (chosen[0] == '高' && unit.selectedcost != '?' && unit.selectedcost < 26) return false;
    chosen = $('#navidiv #searchdiv #searchinput').val();
    if (RegExp(chosen).exec(unit.name) == undefined) return false;
    return true;
}

//generate new unitlist use filter and order. if israndom15, randomly choose at most 15 unit and sort
var israndom15 = false;
function generateunitlist() {
    showdata = [];
    for (var i = 0; i < unitdata.length; i ++ )
        if (checkoneunit(unitdata[i]))
            showdata.push(unitdata[i]);
    if (israndom15){
        if (showdata.length > 15){
            for (var i = 0; i < 15; i ++ ){
                var j = getrandomint(i, showdata.length);
                var tmp = showdata[i];
                showdata[i] = showdata[j];
                showdata[j] = tmp;
            }
        }
        showdata.splice(15, showdata.length);
    }
    israndom15 = false;
    showdata = showdata.sort(unitsortcompare);
    return showdata;
}

//update unitlist with filter, make animation
var unitlistupdating = false;
function unitlistupdate(vue, el) {
    if (unitlistupdating) return;
    unitlistupdating = true;
    $('html,body').animate({ scrollTop: 0 }, 333);
    $('#unitlistdiv').animate({ opacity: '0' }, 333, function () {
        showdata = generateunitlist();
        if (vue == undefined){
            addunitlist(el, 'unitdata');
            vue = new Vue({ el: el, data: { unitdata: [] } });
        }
        unitdataload(el, vue, showdata, () => {
            $(el).animate({ opacity: '1' }, 500);
        });
        unitlistupdating = false;
    });
    return vue;
}

//adjust .unit-class-list width
function changeunitclasslistwidth(){
    $('.unit-class-list').css('width', $('.chosendiv').css('width'));
}

//adjust .unit-class-list width when window size changed
$(document).ready(function () {$(window).resize(changeunitclasslistwidth);});