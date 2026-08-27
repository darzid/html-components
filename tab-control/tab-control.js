customElements.define("tab-control", class TabControl extends HTMLElement {
    tabPanels = [];
    tabButtons = [];
    
    constructor(){
        super();
    
        this.onMutation = this.onMutation.bind(this);
        this.tabsAdded = false;
    }
    
    onMutation(mutations) {
        if (this.tabsAdded) return;
        
        const newElements = [];
    
        // A `mutation` is passed for each new node
        for (const mutation of mutations) {
          // Could test for `mutation.type` here, but since we only have
          // set up one observer type it will always be `childList`
          newElements.push(...mutation.addedNodes);
        }
        this.tabPanels = newElements.filter(el => el.nodeType === Node.ELEMENT_NODE && el.className == "tab-panel");
        
        this.tabsAdded = true;
        
        let tabPanelContainer = document.createElement("div");
        tabPanelContainer.classList.add("tab-control");
        this.appendChild(tabPanelContainer);
        
        let tabstripElement = document.createElement("div");
        tabstripElement.className = "tab-strip";
        
        if (this.tabstripLocation == "top") 
            tabPanelContainer.appendChild(tabstripElement);
        
        let tabPanelsContainer = document.createElement("div");
        tabPanelsContainer.classList.add("tab-panels");
        tabPanelContainer.appendChild(tabPanelsContainer);
        
        this.tabPanels.forEach(tabPanel => {
            tabPanel.style.display = "none";
            tabPanel.classList.add("tab-panel");
            tabPanelsContainer.appendChild(tabPanel);
        });
        
        if (this.tabstripLocation == "bottom") 
            tabPanelContainer.appendChild(tabstripElement);
        
        this.tabPanels.forEach(tabPanel => {
            let tabButton = document.createElement("button");
            tabButton.className = "tab-button";
            tabButton.innerText = tabPanel.getAttribute("name");
            tabstripElement.appendChild(tabButton);
            this.tabButtons.push(tabButton);
            tabButton.onclick = () => this.clickTab(tabButton);
        });
        
        this.clickTab(this.tabButtons[0]);
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
            is:"tab-control",
            properties:{
                color:                      {type:String, value:"",     defaultValue:"#000000"},
                backgroundColor:            {type:String, value:"#e0e0e0",     defaultValue:"#e0e0e0"},
                tabstripBackgroundColor:    {type:String, value:"",     defaultValue:"#808080"},
                inactiveTabBackgroundColor: {type:String, value:"",     defaultValue:"#b0b0b0"},
                activeTabBackgroundColor:   {type:String, value:"",     defaultValue:"#d0d0d0"},
                tabstripLocation:           {type:String, value:"top"},
                canCloseAll:                {type:Boolean, value:false },
                width:                      {type:String, value:"",     defaultValue:"400px"},
                height:                     {type:String, value:"",     defaultValue:"400px"},
                'class':                    {type:String, value:"tab-control"}
            },
        };
        let computedStyle = window.getComputedStyle(this);
        this.defineprop(computedStyle);
        
        let css = `<style>
.tab-control {
  background-color: ${this.backgroundColor};
  border: 1pt solid rgba(0,0,0,0.5);
  width: ${this.width};
  height: ${this.height};
  
  .tab-strip {
    margin: 0px;
    padding: 0px;
    padding-left: 1px;
    width: stretch;
    background-color: ${this.tabstripBackgroundColor};
    
    .tab-button {
      border: 1px solid rgba(0,0,0,0.5);
      background-color: ${this.inactiveTabBackgroundColor};
      transition: 0.3s;
    }
    
    .tab-button.active-tab {
      background-color: ${this.activeTabBackgroundColor};
    }
  }
  
  .tab-panels {
    padding: 5px;
    height: stretch;
  }
  
  .tab-panel {
    display: none;
    height: 94%; 
    transition: 1.3s;
    border: 1px solid rgba(0,0,0,0.5);
  }
}
:host {
    user-select: none;
    padding:0;
    margin:0;
}
</style>`;
        this.innerHTML = css;

        // Set up observer
        this.observer = new MutationObserver(this.onMutation);
    
        // Watch the Light DOM for child node changes
        this.observer.observe(this, {
          childList: true
        });
        
        this.ready=function(){
            
        };

        this.clickTab=function(tabButton) {
            let canCloseAll = this.canCloseAll === "true";
            let isClickedTabOpen = tabButton.classList.contains("active-tab");
            let shouldCloseTab = isClickedTabOpen && canCloseAll;
            let shouldSwitchTab = !isClickedTabOpen;
            console.log(`clickTab, isClickedTabOpen:${isClickedTabOpen}, shouldCloseTab:${shouldCloseTab}, shouldSwitchTab:${shouldSwitchTab}, canCloseAll: ${this.canCloseAll}`);
            let tabPanel = this.tabPanels.find(tabPanel => tabPanel.getAttribute("name") === tabButton.innerText);
            
            if (shouldCloseTab) {
                tabPanel.style.display = "none";
                tabButton.classList.remove("active-tab");
                console.log("closed tab", shouldCloseTab)
                return;
            } 
            else if (shouldSwitchTab) {
                // Get all elements with class="tablinks" and remove the class "active"
                this.tabButtons.forEach(button => button.classList.remove("active-tab"));
                this.tabPanels.forEach(panel => panel.style.display = "none");
                tabPanel.style.display = "flex";
                tabButton.classList.add("active-tab");
                console.log("switched tab");
                return;
            }
        };
        
        this.ready();
    }
    
    disconnectedCallback() {
        // remove observer if element is no longer connected to DOM
        this.observer.disconnect();
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
});