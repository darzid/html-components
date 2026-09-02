customElements.define("number-input", class NumberInput extends HTMLElement {
    constructor(){
        super();
    }
    
    defineprop(computedStyle){
        const plist=this.module.properties;
        for(let k in plist){
            const v = plist[k];
            let value = v.value;
            if (!value) {
                if (computedStyle[k]) {
                    value = computedStyle[k];
                } else if (v.defaultValue) {
                    value = v.defaultValue;
                }
            }
            this["_"+k] = this.getAttr(k,value);
            
            Object.defineProperty(this, k, {
                get:()=>{return this["_"+k]},
                set:(val)=>{
                    this["_"+k] = val;
                    if(typeof(this[v.observer])=="function")
                        this[v.observer]();
                }
            });
        }        
    }
    
    connectedCallback(){
        let root;
        root=this;
        
        this.module = {
            is:"number-input",
            properties:{
                id:                 {type:String, value:""},
                name:               {type:String, value:""},
                fill:               {type:String, value:"",  defaultValue:"#00b7b7"},
                color:              {type:String, value:"",  defaultValue:"#000000"},
                backgroundColor:    {type:String, value:"",  defaultValue:"#ffffff"},
                textAlign:          {type:String, value:"",  defaultValue:"center"},
                width:              {type:String, value:"",  defaultValue:"4em"},
                min:                {type:Number, value:0,   observer:"updateRange"},
                max:                {type:Number, value:100, observer:"updateRange"},
                step:               {type:Number, value:1,   observer:"updateRange"},
                value:              {type:Number, value:0,   observer:"valueAttributeUpdated"},
                'class':            {type:String, value:"number-input"}
            },
        };
        let computedStyle = window.getComputedStyle(this);
        this.defineprop(computedStyle);
        let idAttribute = this.id ? `id="${this.id}" ` : "";
        let nameAttribute = this.name ? `name="${this.name}" ` : "";
        root.innerHTML =
`<style>
.number-input {
    color: ${this.color},
    background-color: ${this.backgroundColor},
    text-align: ${this.textAlign};
    width: ${this.width};
}
:host {
    user-select: none;
    padding:0;
    margin:0;
}
</style>
<input ${idAttribute} ${nameAttribute} type="number" class="${this.class}" min="${this.min}" max="${this.max}" step="${this.step}" value="${this.value}">`;
        this.ready=function(){
            console.log("ready()");
            
            this.inputElement=root.children[1];
            this.inputElement.addEventListener("input", this.bindinput, false);
            this.inputElement.addEventListener("change", this.bindchange, false);
            this.inputElement.addEventListener("pointerdown", this.bindpointerdown, false);
        
            this.pointerDownPosition = null;
            
            this.drawFill();
        };

        this.sendOnInput=function() {
            if (this.value === this.inputElement.value)
                return;
                
            this.value = this.inputElement.value;
            var evnt = this["oninput"];
            if (evnt)
                evnt.call(this, { currentTarget: this });
        }
        
        this.sendOnChange=function() {
            //console.log("sendOnChange")
            if (this.value != this.inputElement.value)
                this.value = this.inputElement.value;
            
            var evnt = this["onchange"];
            if (evnt)
                evnt.call(this, { currentTarget: this });
        }
        
        this.input = function(ev) {
            //console.log("input");
            
            if (this.inputElement.value === this.value)
                return;
                
            this.drawFill();
            this.sendOnInput();
        };
        this.bindinput=this.input.bind(this);
        
        this.change = function(ev) {
            console.log("change");
            
            if (this.inputElement.value === this.value)
                return;
                
            this.sendOnChange();
        };
        this.bindchange=this.change.bind(this);
        
        this.pointerdown=function(ev) {
            this.pointerDownPosition = { clientX: ev.clientX, clientY: ev.clientY };
            
            window.addEventListener("touchmove", this.bindtouchmove, false);
            window.addEventListener("touchend", this.bindpointerup, false);
            this.inputElement.addEventListener("pointerup", this.bindpointerup, false);
        };
        this.bindpointerdown=this.pointerdown.bind(this);
        
        this.touchmove=function(ev){
            let e = ev.touches ? ev.touches[0] : ev;
            let movementX = e.clientX - this.pointerDownPosition.clientX;
            let movementY = e.clientY - this.pointerDownPosition.clientY;
            
            let range = parseFloat(this.max) - parseFloat(this.min);
            let movement = (Math.abs(movementY) > Math.abs(movementX)) ? -0.25 * movementY : 1 * movementX;
            
            let decimals = this.step ? parseFloat(this.step).countDecimals() : 0;
            let value = (parseFloat(this.inputElement.value) + ((movement / 100) * range));
            value = parseFloat(value.toFixed(decimals)).clamp(this.min, this.max);
            
            this.pointerDownPosition.clientX = e.clientX;
            this.pointerDownPosition.clientY = e.clientY;

            this.inputElement.value = value;
            this.drawFill();
            this.sendOnInput();
            this.sendOnChange();
        };
        this.bindtouchmove=this.touchmove.bind(this);
        
        this.pointerup=function(ev) {
            window.removeEventListener("touchmove", this.bindtouchmove, false);
            this.inputElement.removeEventListener("pointerup", this.bindpointerup, false);
            window.removeEventListener("touchend", this.bindpointerup, false);
        };
        this.bindpointerup=this.pointerup.bind(this);
        
        this.updateRange=function(){
            if (this.min && this.min != this.inputElement.min) {
                this.inputElement.min = this.min;
                if (parseFloat(this.inputElement.value) < this.inputElement.min) {
                    console.log(`Min correction from ${this.inputElement.value} to ${this.min}`);
                    this.inputElement.value = this.min;
                    this.sendOnInput();
                    this.sendOnChange();
                } 
                this.drawFill();
            }
            if (this.max && this.max != this.inputElement.max) {
                this.inputElement.max = this.max;
                if (parseFloat(this.inputElement.value) > this.max) {
                    console.log(`Max correction from ${this.inputElement.value} to ${this.max}`);
                    this.inputElement.value = this.max;
                    this.sendOnInput();
                    this.sendOnChange();
                } 
                this.drawFill();
            }
            if (this.step && this.step != this.inputElement.step) {
                this.inputElement.step = this.step;
                
                let allowedDecimals = parseFloat(this.step).countDecimals();
                let currentDecimals = parseFloat(this.inputElement.value).countDecimals();
                if (currentDecimals > allowedDecimals) {
                    let value = parseFloat(this.inputElement.value).toFixed(allowedDecimals);
                    this.inputElement.value = value;
                    this.sendOnInput();
                    this.sendOnChange();
                }
            }
                
        };
        
        this.valueAttributeUpdated=function() {
            this.inputElement.value = this.value;
            this.drawFill();
            this.sendOnInput();
            this.sendOnChange();
        }
        
        this.drawFill=function() {
            let progress = 100 * ((this.inputElement.value - this.min) / (this.max - this.min));
            let backgroundImage = `linear-gradient(to right, ${this.fill} 0%, ${this.fill} ${progress}%, ${this.backgroundColor} ${progress}%, ${this.backgroundColor} 100%)`;
            this.inputElement.style.backgroundImage = backgroundImage;
            console.log("drawFill()", this.inputElement, backgroundImage);
        }
        
        this.ready();
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`Attribute ${name} has changed.`);
    }
      
    getAttr(n, def) {
        let v = this.getAttribute(n);
        if (v == "" || v == null) return def;
        switch (typeof(def)) {
            case "number":
                if (v == "true") return 1;
                v = +v;
                if (isNaN(v)) return 0;
                return v;
        }
        return v;
    }
    
    sendEvent(ev){
        let event;
        event=document.createEvent("HTMLEvents");
        event.initEvent(ev,false,true);
        this.dispatchEvent(event);
    }
});

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};
Number.prototype.countDecimals = function () {
    if(Math.floor(this.valueOf()) === this.valueOf()) return 0;
    return this.toString().split(".")[1].length || 0; 
}
