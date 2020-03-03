# rabbit-component
a flexible and small data mount front end framework

##概览
rabbit-component.js是一个轻量级的前端渲染框架,具有快速将数据渲染到视图上的能力，并响应式修改视图的能力。
1.挂载：rabbit-component将数据和方法与html模板挂载，根据数据与模板属性创建虚拟的节点，节点的属性记录了此节点的类型、数据模型、动态属性与动态类型与事件。
2.渲染：在挂载后rabbit-component会初次从根节点渲染一次，之后的数据模型变动只会局部渲染受到影响的节点
3.事件：触发事件没有办法像vue那样使用无头函数将参数传入方法，可以使用动态属性获取当前数据的index再在数据上进行相关操作

##开始
###导入
rabbit-component.js与rabbit的ui分离，可以单独使用，点击下面的链接下载js文件，在相应的html文件中使用script标签链接
``` html
<script src="./rabbit-component.js"></script>
```

##指令
###rabbit-text
将数据中的对应数据使用innerText渲染到节点 
``` html
<p rabbit-text="passage.title"></p>
```
###rabbit-html
将数据中的对应数据使用innerText渲染到节点 
``` html
 <p rabbit-text="passage.title"></p>
```
###rabbit-if
如果数据对应的值为true则渲染，其他情况则不显示,并且若开始时其值为false此节点的子节点不会挂载到节点树中， 当其第一次由false变为true时，其子节点开始挂载渲染，对于还未加入数据先使用rabbit-if隔断其挂载 
``` html
<p rabbit-html="passage.content"></p>
```
###rabbit-for
对数组数据进行递归渲染，rabbit-key定义在数组中引用相应对象的变量名,rabbit-index则定义相应数据在数组中的索引变量名 
``` html
                   <button rabbit-for="passage.tags" rabbit-key="tag">
                       <span rabbit-text="tag.name"></span>
                   </button>
```
###+class
若第一个参数与第二个参数相等则使用第三个参数作为类，加入到class属性中 
``` html
                    <p rabbit-for="links" rabbit-key="link" rabbit-index="linkIndex">
                        <a href="" class="link" +class="linkIndex,currentIndex,'current',''">content</a>
                    </p>
```
###:attribute
动态渲染属性，注意属性值中引用的变量必须使用{{}}包裹 
``` html
<a  rabbit-text="passage.title" :href="{{passage.id}}"></a>
```

##示例

