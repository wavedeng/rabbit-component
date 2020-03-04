# rabbit-component
a flexible and small data mount front end framework

## 概览
rabbit-component.js是一个轻量级的前端渲染框架,具有快速将数据渲染到视图上的能力，并响应式修改视图的能力。
1. 挂载：rabbit-component将数据和方法与html模板挂载，根据数据与模板属性创建虚拟的节点，节点的属性记录了此节点的类型、数据模型、动态属性与动态类型与事件。
2. 渲染：在挂载后rabbit-component会初次从根节点渲染一次，之后的数据模型变动只会局部渲染受到影响的节点
3. 事件：触发事件没有办法像vue那样使用无头函数将参数传入方法，可以使用动态属性获取当前数据的index再在数据模型上进行相关操作

## 开始
### 导入
rabbit-component.js与rabbit的ui分离，可以单独使用，点击下面的链接下载js文件，在相应的html文件中使用script标签链接
``` html
<script src="./rabbit-component.js"></script>
```

## 指令
### rabbit-text
将数据中的对应数据使用innerText渲染到节点 
``` html
<p rabbit-text="passage.title"></p>
```
### rabbit-html
将数据中的对应数据使用innerText渲染到节点 
``` html
 <p rabbit-text="passage.title"></p>
```
### rabbit-if
如果数据对应的值为true则渲染，其他情况则不显示,并且若开始时其值为false此节点的子节点不会挂载到节点树中， 当其第一次由false变为true时，其子节点开始挂载渲染，对于还未加入数据先使用rabbit-if隔断其挂载 
``` html
<p rabbit-html="passage.content"></p>
```
### rabbit-for
对数组数据进行递归渲染，rabbit-key定义在数组中引用相应对象的变量名,rabbit-index则定义相应数据在数组中的索引变量名 
``` html
<button rabbit-for="passage.tags" rabbit-key="tag">
    <span rabbit-text="tag.name"></span>
</button>
```
### +class
若第一个参数与第二个参数相等则使用第三个参数作为类，加入到class属性中 
``` html
<p rabbit-for="links" rabbit-key="link" rabbit-index="linkIndex">
   <a href="" class="link" +class="linkIndex,currentIndex,'current',''">content</a>
</p>
```
### :attribute
动态渲染属性，注意属性值中引用的变量必须使用{{}}包裹 
``` html
<a  rabbit-text="passage.title" :href="/series/{{series.id}}/passage/{{passage.id}}"></a>
```

##示例
``` html
  <div class="example-container flex">
      <div class="rabbit-card passage-example right-10" rabbit-for="passages" rabbit-key="passage" rabbit-index="index">
          <div class="card-header">
              <img class="card-cover" src="/images/card.jpg" alt="Alternate Text" />
          </div>
          <div class="card-tail rabbit-card-2">
              <div class="tail-top">
                  <p class="card-subtitle" rabbit-text="passage.time"></p>
              </div>
              <div class="tail-middle">
                  <h2 class="card-title" rabbit-text="passage.title"></h2>
                  <p class="card-desc" rabbit-text="passage.desc"></p>
              </div>
              <div class="tail-bottom flex space-between">
                  <div class="tags" rabbit-if="passage.tags">
                      <button class="rabbit-rectangle-button small-button" rabbit-for="passage.tags" rabbit-key="tag"><span rabbit-text="tag.name"></span></button>
                  </div>
                  <span class="rabbit-image-text pointer" on:click="thumb" :index="{{index}}">
                      <img class="image" src="./images/thumb_up.png" alt="Alternate Text" />
                      <span class="text" rabbit-text="passage.thumbCount"></span>
                  </span>
              </div>
          </div>
      </div>
  </div>
```

``` js
      var passageComponent = new rabbit.Component(".passage-example");
      var passages = [
       { title: "我是第一篇文章",desc:"我是第一个描述",time:"2020.3.3", thumbCount: 0,thumbed:false },
       { title: "我是第二篇文章",desc:"我是第二个描述", time:"2020.3.4", thumbCount: 0, thumbed: false, tags: [{ name: "随笔" },{name:"前端"}]}
      ]
      passageComponent.mount({ passages}, { thumb: thumb });
      function thumb() {
       var index = this.getAttribute("index");
       if (passages[index].thumbed == true) {
        alert("你已经点赞过这篇文章了！！！！！");
        return;
      }
       passages[index].thumbCount++;
       passages[index].thumbed = true;
      }
```

## HTTP模块
rabbit.http模块将ajax请求封装
### rabbit.http.get(url,sucCallback,failCallback)

```
      //发送ajax get请求至相应地址，根据结果执行相应的回调函数
      //url: 地址
      //sucCallback: 成功回调（status==200||status==304）
      //failCallback: 失败回调
```

### rabbit.http.post(url,formData,sucCallback,failCallback)

```
      //发送ajax post请求至相应地址，根据结果执行相应的回调函数
      //url: 地址
      //formData: 使用FormData传递的数据
      //sucCallback: 成功回调（status==200||status==304）
      //failCallback: 失败回调
```

### rabbit.http.patch(url,formData,sucCallback,failCallback)

```
      //发送ajax patch请求至相应地址，根据结果执行相应的回调函数
      //url: 地址
      //formData: 使用FormData传递的数据
      //sucCallback: 成功回调（status==200||status==304）
      //failCallback: 失败回调
```

### rabbit.http.put(url,formData,sucCallback,failCallback)

```
      //发送ajax put请求至相应地址，根据结果执行相应的回调函数
      //url: 地址
      //formData: 使用FormData传递的数据
      //sucCallback: 成功回调（status==200||status==304）
      //failCallback: 失败回调
```

### rabbit.http.delete(url,formData,sucCallback,failCallback)

```
      //发送ajax delete请求至相应地址，根据结果执行相应的回调函数
      //url: 地址
      //formData: 使用FormData传递的数据
      //sucCallback: 成功回调（status==200||status==304）
      //failCallback: 失败回调
```


