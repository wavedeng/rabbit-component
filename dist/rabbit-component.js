/*!
 * Rabbit-Component.js v1.1.2
 * (c) 2020-2025 Wave Deng
 * Released under the MIT License.
 */

//Global config for rabbit component

(function (global, factory) {
    "use strict";
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports == global.document ?
            factory(global) :
            function (w) {
                if (!w.document) {
                    throw new Error("rabbit requires a window with a document");
                }
                return factory(w);
            }
    } else {
        factory(global);
    }
})(typeof window !== "undefined" ? window : this, function (window) {
    "use strict";


    //config
    //global config for component operations
    const _globalConfig = {

        nodeTypeAttribue: [
            "rabbit-text",
            "rabbit-html",
            "rabbit-for"
        ],
        ifAttribute: "if",
        addClassAttribute: "+class",

        //node type
        //one virtual node can just have a type.
        nodeType: {
            root: 0,
            text: 1,
            html: 2,
            array: 3,
            item: 4,
            unknown: 5
        },
        eventAttributePrefix: "on:",
        eventNames: [
            'click',
            'change'
        ]
    }

    //patch functions of Array
    //modify the array functions of javascript for responsive purpose
    var rabbitArrayProto = (function CreateRabbitArrayProto() {
        var arrayProto = Array.prototype;

        var rabbitArrayProto = Object.create(arrayProto);

        //the methods to be modified
        var methodsToPatch = [
            'push',
            'pop',
            'shift',
            'unshift',
            'splice',
            'sort',
            'reverse'
        ]

        methodsToPatch.forEach(method => {

            //the original method
            var oriMethod = arrayProto[method];

            //patch 
            patch(rabbitArrayProto, method, function patchMethod() {
                var args = arguments, argLen = arguments.length;

                //execute the original method at first
                var result = oriMethod.apply(this, args);


                //observers of the array
                var observers = this.observers;



                var sort = false;

                if (method == "push") {
                    observers.forEach(observer => {
                        let newNodes = [];
                        let node = observer.target;
                        for (let i = 0; i < args.length; i++) {
                            newNodes.push(new TreeNode(node.element.cloneNode(true), _globalConfig.nodeType.item, args[i], node));
                        }
                        oriMethod.apply(observer.target.children, newNodes);
                        mountNewItemNodes(observer.component, newNodes);
                    });
                }
                else if (method == "unshift") {
                    observers.forEach(observer => {
                        var newNodes = [];
                        let node = observer.target;
                        for (let i = 0; i < args.length; i++) {
                            newNodes.push(new TreeNode(node.element.cloneNode(true), _globalConfig.nodeType.item, args[i], node));
                        }
                        oriMethod.apply(observer.target.children, newNodes);
                        mountNewItemNodes(observer.component, newNodes);
                    })
                }
                else if (method == "splice") {
                    observers.forEach(observer => {
                        let newArgs = [];
                        let newNodes = [];
                        for (let i = 0, l = args.length; i < l; i++) {
                            if (i > 2) {
                                let newNode = new TreeNode(node.element.cloneNode(true), _globalConfig.nodeType.item, args[i], node);
                                newArgs.push(newNode);
                                newNodes.push(newNode);
                            }
                            else {
                                newArgs.push(args[i]);
                            }
                        }
                        mountNewItemNodes(observer.component, newNodes);
                        deleteItemEles(oriMethod.apply(observer.target.children, newArgs));
                    });
                }

                else if (method == "pop") {
                    observers.forEach(observer => {
                        let deletedItems = [];
                        deletedItems.push(oriMethod.apply(observer.target.children, args));
                        deleteItemEles(deletedItems);
                    });
                }
                else if (method == "shift") {
                    observers.forEach(observer => {
                        let deletedItems = [];
                        deletedItems.push(oriMethod.apply(observer.target.children, args));
                        deleteItemEles(deletedItems);
                    });
                }
                else if (method == "sort") {
                    //sort = true;
                    observers.forEach(observer => {
                        oriMethod.apply(observer.target.children, [(child1, child2) => { return args[0].apply(observer.target.children, [child1.model, child2.model]) }]);
                    });
                }
                else if (method == "reverse") {
                    observers.forEach(observer => {
                        oriMethod.apply(observer.target.children, args);
                    });
                }

                updateArrayNodeTree(observers, sort, this);
                return result;
            });

        });
        return rabbitArrayProto;
    })();


    function deleteItemEles(nodes) {
        nodes.forEach(node => {
            node.element.parentElement.removeChild(node.element);
        });
    }



    function mountNewItemNodes(component, newNodes) {
        newNodes.forEach(node => {
            component.mountBunch(node);
            component.renderBunch(node);
        });
    }




    //update the array node and render since the model of node has changed
    function updateArrayNodeTree(observers, sort, array) {

        //mount the item node and render the array tree
        observers.forEach(observer => {
            let children = observer.target.children;
            for (let i = 0, l = children.length; i < l; i++) {
                children[i].itemIndex = i;
            }
            observer.component.sortItemNodes(observer.target);
        });

    }


    //Component
    //represent the combination of the data and template
    function Component(selector) {
        this.template = document.querySelector(selector);

        if (this.template == null) {
            console.error("rabit can not find the template from the selector:'" + selector + "', please check it.");
        }

        this.tree = {};
        this.method = {};
        this.data = {};
    }


    //mount the component with the data and methods.
    Component.prototype.mount = function (data, methods) {
        this.data = data;
        this.methods = methods ? methods : {};
        this.mountTree();
        this.renderTree();
    }

    //mount the node tree
    Component.prototype.mountTree = function () {
        var rootEle = this.template;
        this.tree.root = this.hangNode(null, rootEle);
        this.mountBunch(this.tree.root);
    }


    //mount the children node of current node
    //element: the template of current node
    Component.prototype.mountBunch = function (node, element) {
        if (element == undefined) {
            element = node.element;
        }

        //if the node is not active, then stop mount the children
        if (node.active == false) {
            return;
        }

        //mount the item node of the array node directly if array node
        if (node.type == _globalConfig.nodeType.array) {
            this.mountItemNodes(node);
            return;
        }

        for (let i = 0, l = element.children.length; i < l; i++) {
            let newNode = this.hangNode(node, element.children[i]);
            if (newNode === null) {
                this.mountBunch(node, element.children[i]);
            }
            else {
                this.mountBunch(newNode);
            }
        }

    }

    // mount the item nodes of array node
    Component.prototype.mountItemNodes = function (arrayNode) {
        let array = arrayNode.model;

        //mean that the array is not exist
        if (array == null) {
            console.error("please set the rabbit-for to an array type value");
            console.error("if you want to prevent mounting,please put it in an if element which detemine if the array exists");
        }
        else if (!Array.isArray(array)) {
            console.error("please set the rabbit-for to an array type value");
        }
        let element = arrayNode.element;
        for (let i = 0, l = array.length; i < l; i++) {
            let itemEle = element.cloneNode(true);
            let itemNode = this.hangNode(arrayNode, itemEle, array[i]);
            if (itemNode == null) {
                itemNode = new TreeNode(itemEle, _globalConfig.nodeType.item, array[i], arrayNode)
            }
            else {
                itemNode.type = _globalConfig.nodeType.item;
            }
            itemNode.itemIndex = i;
            if (itemNode.active == false) {
                continue;
            }
            this.mountBunch(itemNode);
            arrayNode.children.push(itemNode);
        }
    }


    //hange the node to the parent node
    Component.prototype.hangNode = function (parentNode, element, model) {
        var node = null;
        var attributes = element.attributes;

        var attributesToDelete = [];

        //if there is any model,then this is a item node.
        if (model != undefined) {
            node = new TreeNode(element, _globalConfig.nodeType.item, model, parentNode);
        }

        //if the parent node is null,then this is the root node.but it can have type such as array
        if (parentNode == null) {
            parentNode = new TreeNode();
            node = new TreeNode(element, _globalConfig.nodeType.unknown, null, null);
        }


        var arrayNode = false;
        for (let i = 0, l = attributes.length; i < l; i++) {
            if (attributes[i].name == "rabbit-for") {
                arrayNode = true;
            }
        };


        //if array node
        //set the scope variable and remove the element from its parent element
        if (arrayNode) {
            return this.hangArrayNode(parentNode, element);
        }


        for (let i = 0, l = attributes.length; i < l; i++) {
            let att = attributes[i];
            let typeIndex = _globalConfig.nodeTypeAttribue.indexOf(att.name);

            //identify if the attribute is used by rabbit
            let rabbitAttribue = false;


            if (typeIndex !== -1) {
                rabbitAttribue = true;

                let nodeType = null;

                if (typeIndex == 0) {
                    nodeType = _globalConfig.nodeType.text;
                }
                else if (typeIndex == 1) {
                    nodeType = _globalConfig.nodeType.html;
                }

                if (node === null) {
                    node = new TreeNode(element, nodeType, null, parentNode);
                }

                this.setWatcher(node, att.value, node);
                parentNode.children.push(node);
            }

            //control the active of the node
            else if (att.name == _globalConfig.ifAttribute) {

                rabbitAttribue = true;

                if (node === null) {
                    node = new TreeNode(element, _globalConfig.nodeType.unknown, null, parentNode);
                    parentNode.children.push(node);
                }

                //if the value start with !
                let reverse = false;

                if (att.value[0] == '!') {
                    reverse = true;
                }

                let ifController = new IfController(null, node, reverse);

                let variable = att.value;
                if (reverse) {
                    variable = variable.slice(1);
                }

                //any time the variable changed, invoke the ifController
                this.setWatcher(node, variable, ifController);
            }


            else if (att.name == _globalConfig.addClassAttribute) {
                rabbitAttribue = true;

                if (node === null) {
                    node = new TreeNode(element, _globalConfig.nodeType.unknown, null, parentNode);
                    parentNode.children.push(node);
                }

                this.createAddClass(att, node);
            }

            else if (att.name.indexOf(_globalConfig.eventAttributePrefix) == 0) {
                rabbitAttribue = true;
                if (node === null) {
                    node = new TreeNode(element, _globalConfig.nodeType.unknown, null, parentNode);
                    parentNode.children.push(node);
                }

                let eventName = att.name.substr(_globalConfig.eventAttributePrefix.length);

                if ((_globalConfig.eventNames.indexOf(eventName) == -1)) {
                    console.error("rabbit can not identify your event:" + eventName);
                }

                let handlerName = att.value;
                if (!(handlerName in this.methods)) {
                    console.error("the methods you passed in do not contain method named " + handlerName);
                };

                var handlerFun = this.methods[handlerName];
                var event = new RabbitEvent(handlerFun, node);
                event.mount();
                node.events.push(event);
            }


            //attribute 
            else if (att.name[0] == ":") {
                rabbitAttribue = true;

                if (node === null) {
                    node = new TreeNode(element, _globalConfig.nodeType.unknown, null, parentNode);
                    parentNode.children.push(node);
                }

                let name = att.name.substr(1, att.name.length - 1);
                let value = att.value;
                let attribute = new RabbitAttribute(name, null, node, value);

                let variables = GetVariablesFromString(value);

                if (variables == null) {
                    console.error("the varibles in attribute must be wrapped by the {{}},please check " + att.name);
                }

                let datas = [];
                variables.forEach(variable => {
                    var data = new RabbitData(null, attribute);
                    data.name = variable;
                    this.setWatcher(node, variable, data);
                    datas.push(data);
                });
                attribute.variables = datas;
                node.attributes.push(attribute);
            }



            if (rabbitAttribue) {
                attributesToDelete.push(att.name);
            }

        }

        //delete the attributes used by rabbit
        attributesToDelete.forEach(attribute => {
            element.removeAttribute(attribute);
        });

        return node;

    }


    Component.prototype.sortItemNodes = function (node) {
        node.children.forEach(child => {
            node.parentElement.insertBefore(child.element, node.refElement);
        });
    }

    //hang the array node
    Component.prototype.hangArrayNode = function (parentNode, element) {
        var node = new TreeNode(element, _globalConfig.nodeType.array, null, parentNode);
        var itemName = getAttributeValue(element, "rabbit-key");
        if (itemName == null) {
            console.error("please add 'rabbit-key' to identity the name of item in array");
        }
        element.removeAttribute("rabbit-key");
        node.itemName = itemName;

        var itemIndexName = getAttributeValue(element, "rabbit-index");
        if (itemIndexName != null) {
            element.removeAttribute("rabbit-index");
            node.itemIndexName = itemIndexName;
        }

        this.setWatcher(node, getAttributeValue(element, "rabbit-for"), node);

        //remove the rabbit-array attribue from the element
        element.removeAttribute(_globalConfig.nodeTypeAttribue[2]);
        node.parentElement = element.parentElement;
        var refElement = document.createElement("p");
        refElement.style.display = "none";
        refElement.classList.add("rabbit-reference");
        node.parentElement.insertBefore(refElement, element);

        node.refElement = refElement;
        node.parentElement.removeChild(element);

        parentNode.children.push(node);

        return node;
    }


    //get the corresponding attribute value of element
    function getAttributeValue(element, name) {
        let att = element.getAttribute(name);
        if (att == null) {
            return null;
        }
        else {
            return att;
        }
    }


    //add class thing config
    Component.prototype.createAddClass = function (att, node) {
        let addClaValue = att.value;
        let addClaConfig = addClaValue.split(",");

        if (addClaConfig.length != 4) {
            console.error("your +class " + addClaValue + " must have something wrong");
        }

        var classer = new RabbitClasser(null, null, strap(addClaConfig[2]), strap(addClaConfig[3]),node);
        var compare1 = new RabbitData(null, classer);
        this.setWatcher(node, addClaConfig[0], compare1);

        let compare2String = addClaConfig[1];
        var compare2 = new RabbitData(null, classer);

        //we dont need to set it as responsive if the the second value is const string
        if (compare2String[0] == "'" && compare2String[compare2String.length - 1] == "'") {
            compare2.model = strap(compare2String);
        }
        else {
            if (compare2String == "true") {
                compare2.model = true;
            }
            else if (compare2String == "false") {
                compare2.model = false;
            }
            else {
                this.setWatcher(node, compare2String, compare2);
            }
        }

        classer.compare1 = compare1;
        classer.compare2 = compare2;
        //console.log(classer);
        node.classer = classer;
    }



    //render the data on the view
    Component.prototype.renderTree = function () {
        var root = this.tree.root;
        this.renderBunch(root);
    }


    //render the tree start with the corresponding node.
    //render dom element by the attributes and the type of the node. 
    Component.prototype.renderBunch = function (node) {
        if (node.active === false) {
            node.element.style.display = "none";
            return;
        }
        else {
            node.element.style.display = '';
        }

        if (node.type == _globalConfig.nodeType.text) {
            node.element.innerText = node.model;
        }
        else if (node.type == _globalConfig.nodeType.html) {
            node.element.innerHTML = node.model;
        }

        //if item node, add the element to the parent element
        else if (node.type == _globalConfig.nodeType.item) {
            node.parent.parentElement.insertBefore(node.element, node.refElement);
            //node.parent.parentElement.appendChild(node.element);
        }

        this.renderAttributes(node);

        //render the children
        node.children.forEach(child => {
            this.renderBunch(child);
        });

    }


    //render the attributes of node
    Component.prototype.renderAttributes = function (node) {

        //attribute
        for (let i = 0, l = node.attributes.length; i < l; i++) {
            let att = node.attributes[i];
            let value = att.pattern;

            //patch the pattern with variables
            att.variables.forEach(variable => {
                value = att.pattern.replace("{{" + variable.name + "}}", variable.model, "g");
            });
            node.element.setAttribute(att.name, value);
        }


        //class attribute
        if (node.classer != null) {
            var rabbitClass = node.classer;
            if (rabbitClass.compare1.model == rabbitClass.compare2.model) {
                if (rabbitClass.class1) {
                    node.element.classList.add(rabbitClass.class1);
                }
                if (rabbitClass.class2) {
                    node.element.classList.remove(rabbitClass.class2);
                }
            }
            else {
                if (rabbitClass.class2) {
                    node.element.classList.add(rabbitClass.class2);
                }

                if (rabbitClass.class1) {
                    node.element.classList.remove(rabbitClass.class1);
                }
            }

        }

    }



    //find the corresponding model of obj,and set it to responsive

    Component.prototype.setWatcher = function (node, hangKey, obj) {

        var domain = this.findDomains(node, hangKey, obj);
        var startPoints = domain.startPoints;
        var startPointDomains = domain.startPointDomains;

        if (!Array.isArray(startPointDomains)) {
            obj.model = startPointDomains;
            return startPointDomains;
        }

        var keyLA = hangKey.split('.');
        var model = null;

        for (let i = startPoints.length - 1; i >= 0; i--) {
            //if more than one domain
            if (i !== 0) {
                if (startPointDomains[i] == keyLA[0]) {
                    model = startPoints[i];
                    for (let k = 1, l = keyLA.length; k < l; k++) {
                        if (k == l - 1) {
                            this.defineReactive(model, keyLA[l - 1], obj);
                        }
                        model = model[keyLA[k]];
                    }
                }
            }

            //if just a domain
            if (i === 0) {
                if (startPoints[i][keyLA[0]] != undefined) {
                    model = startPoints[i];
                    for (let k = 0, l = keyLA.length; k < l; k++) {
                        if (k == l - 1) {
                            this.defineReactive(model, keyLA[l - 1], obj);
                        }
                        model = model[keyLA[k]];
                    }
                }
            }
        }

        if (model === null) {
            console.error("the model of " + hangKey + " is not defined");
        }


        obj.model = model;


        if (obj instanceof IfController) {
            obj.node.active = obj.reverse ? !!!model : !!model;
        }

        return model;
    }


    //loop through the parent domain
    Component.prototype.findDomains = function (node, hangKey, obj) {
        var startPoints = [this.data];
        var startPointDomains = [null];
        while (true) {
            if (node == null) {
                break;
            }

            //if the item type add the array item of it to the domain
            if (node.type == _globalConfig.nodeType.item) {
                let itemName = node.parent.itemName;

                if (itemName == hangKey) {
                    return { startPoints, startPointDomains: node.model };
                }

                let itemIndexName = node.parent.itemIndexName;

                if (itemIndexName == hangKey) {
                    this.defineReactive(node, "itemIndex", obj);
                    return { startPoints, startPointDomains: node.itemIndex };
                }

                startPoints.push(node.model);
                startPointDomains.push(itemName);
            }
            node = node.parent;
        }
        return { startPoints, startPointDomains };
    }



    //change the model of target once the obj[key] change
    Component.prototype.defineReactive = function (obj, key, target) {

        var property = Object.getOwnPropertyDescriptor(obj, key);
        if (property && property.configurable === false) {
            return;
        }
        let val = obj[key];

        //if this value is array change the __proto__
        if (Array.isArray(val)) {
            val.__proto__ = rabbitArrayProto;

            //hang the obserber
            if (val.observers === undefined) {
                val.observers = [new ModelObserver(this, target)];
                Object.defineProperty(val, "observers", { enumerable: false });
            }
            else {
                val.observers.push(new ModelObserver(this, target));
            }

            return;
        }


        //hange the observer on the key
        if (obj.observers === undefined) {
            obj.observers = {};
            obj.observers[key] = [new ModelObserver(this, target)];
            Object.defineProperty(obj, "observers", { enumerable: false });
        }
        else {
            if (obj.observers[key] == undefined) {
                obj.observers[key] = [new ModelObserver(this, target)];
            }
            else {
                obj.observers[key].push(new ModelObserver(this, target));
            }
        }

        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get() {
                return val;
            },
            set(newVal) {
                val = newVal;

                //loop through the observers and change their model

                obj.observers[key].forEach(observer => {
                    var target = observer.target;
                    var component = observer.component;

                    target.model = newVal;
                    //if  treenode render the node
                    if (target instanceof TreeNode) {
                        component.renderBunch(target);
                    }

                    //if ifController set the active
                    else if (target instanceof IfController) {
                        target.run(newVal, observer.component);
                    }

                    else if (target instanceof RabbitAttribute) {
                        component.renderAttributes(target.node);
                    }

                    //add class thing
                    else if (target.target instanceof RabbitClasser) {
                        component.renderAttributes(target.target.node);
                    }


                });

            }
        });

    }



    //treenode class
    //define the attributes and class bind,model things for rendering purpose.
    function TreeNode(element, type, model, parent) {
        this.element = element;
        this.type = type;
        this.model = model;
        this.parent = parent ? parent : null;
        this.children = [];
        this.classer = null;
        this.attributes = [];
        this.active = true;
        this.events = [];
        this.itemIndexName = null;
        this.indexName = null;
        this.parentElement = null;
    }



    function RabbitEvent(handler, node) {
        this.handler = handler;
        this.node = node;
    }

    RabbitEvent.prototype.mount = function () {
        var ele = this.node.element;
        ele.addEventListener("click", this.handler);
    }

    function IfController(model, node, reverse) {
        this.model = model;
        this.node = node;
        this.reverse = reverse;
    }

    IfController.prototype.run = function (newVal,component) {
        var activeNow = this.reverse ? !!!newVal : !!newVal;
        if (activeNow != this.node.active) {
            this.node.active = activeNow;
            if (activeNow == true) {
                component.mountBunch(this.node);
            }
            component.renderBunch(this.node);
        }
    }

    function GetVariablesFromString(string) {
        var variables = [];
        var reg = /{{(.+?)}}/g;
        var matched = string.match(reg);
        if (matched == null) {
            return null;
        }
        matched.forEach(match => {
            variables.push(strap(match, 2));
        });

        return variables;
    }


    function RabbitClasser(compare1, compare2, class1, class2,node) {
        this.compare1 = compare1;
        this.compare2 = compare2;
        this.class1 = class1;
        this.class2 = class2;
        this.node = node;
    }

    function RabbitData(model, target) {
        this.model = model;
        this.target = target;
        this.variable = null;
    }

    function RabbitAttribute(name, variables, node, pattern) {
        this.name = name;
        this.variables = variables;
        this.node = node;
        this.pattern = pattern;
    }


    function ModelObserver(component, target) {
        this.component = component;
        this.target = target;
    }



    //helper functions
    function strap(string, offset) {
        if (string.length == 2) {
            return '';
        }
        if (offset == undefined) {
            offset = 1;
        }
        return string.substr(offset, string.length - offset * 2);
    }


    function patch(obj, key, now) {
        Object.defineProperty(obj, key, {
            value: now,
            enumerable: false,
            configurable: true,
        });
    }


    //insert the element after a specific element



    //network thing
    var _http = {};

    _http.get = function (url, successCallback, failCallback) {
        sendRequest("get", url, null, successCallback, failCallback);
    }

    _http.post = function (url, formData, successCallback, failCallback) {
        sendRequest("post", url, formData, successCallback, failCallback);
    }

    _http.patch = function (url, formData, successCallback, failCallback) {
        sendRequest("patch", url, formData, successCallback, failCallback);
    }


    _http.delete = function (url, formData, successCallback, failCallback) {
        sendRequest("delete", url, formData, successCallback, failCallback);
    }

    _http.put = function (url, formData, successCallback, failCallback) {
        sendRequest("put", url, formData, successCallback, failCallback);
    }



    function sendRequest(method, url, formData, successCallback, failCallback) {
        var request = new XMLHttpRequest();
        request.open(method, url, true);
        request.onreadystatechange = function () {
            if (request.readyState == 4) {
                if (request.status == 200 || request.status == 304) {
                    if (successCallback != undefined) {
                        successCallback(JSON.parse(this.response));
                    }
                }
                else {
                    if (failCallback != undefined) {
                        failCallback(this.response, this.status);
                    }
                }
            }
        }
        if (formData) {
            request.send(formData);
        }
        else {
            request.send();
       }
    }





    if (window.rabbit === undefined) {
        window.rabbit = {};
    }
    window.rabbit.Component = Component;
    window.rabbit.http = _http;

});
