<template>
  <div style="max-height: 300px; overflow-y: scroll; background-color:transparent;">
    <h1 class="my_title">{{title}}</h1>
    <ul>
      <li>
            <div>
                <div>
                    <p>{{text}}</p>
                </div>
            </div>
          </li>
    </ul>
    <ion-button v-on:click="onSubmit" class="my_button">Cool</ion-button>
  </div>
</template>
<script>
//import Vue from 'vue'

export default {
  name: 'GeneralPopupTutorial',
  components:{
  },
  data(){
      return{
          title: this.$gettext("TutCongrTitle"),//"Congratulazioni",
          text: this.$gettext('TutCongrText'),//"Congratulazioni! Hai risposto alla tua prima domanda! Continua così e scalerari la classifica!",
          number: 0,
          finished: false
      }
  },
  mounted: function(){
  },
  updated() {
    this.$nextTick(function () {
       /* 
      this.$refs.openquests.forEach(i=>{
        i.updateAnswers();
      });*/
    // Code that will run only after the
    // entire view has been re-rendered
    })
  },
  methods:{
    async onSubmit(e){
        console.log("CLICKING SUBMIT");
        console.log(e);
        var popup_prova = document.getElementsByClassName("maplibregl-popup");
        console.log(popup_prova)
        console.log(popup_prova[0].style)
        //this.$parent.my_items=null;
        popup_prova[0].style.display="none";
        if(!this.finished){
          switch(this.number){
            case 0: this.$parent.newInfo(this.$gettext("TutPositionTitle"),this.$gettext("TutPositionText"),0); break;
            case 1: this.$parent.newInfo("Menu",this.$gettext("TutMenuText"),1); break;
            case 2: this.$parent.newInfo(this.$gettext("pointsMsg"),this.$gettext("TutPointsText"),2);break;
            case 3: this.$parent.newInfo(this.$gettext("TutPinTitle"), this.$gettext("TutPinText"),3);break;
            case 4: this.$parent.newInfo(this.$gettext("TutEndTitle"),this.$gettext("TutEndText"),4); break;
            default: break;
          }
        }else{
          this.$parent.changePage();
        }
    },

  },

}
</script>

<style>
  .my_button{
    margin-left: auto;
    margin-right: 20px;
    float:right;
    --border-radius: 15px;
    --background: var(--white);/*white;*/
    --color: $color1;
  }

  .my_title{
    display:flex;
    justify-content:center;
  }
  
  .select-style2 {
    border:1px solid #777;
    width: 160px;
    border-radius: 3px;
    overflow: hidden;
    /*overflow-y:scroll;*/
    float:left;
  }

  .select-style2 select {  
    font-size:15px;
    color:black;
    padding: 5px 8px 0px 5px;
    width: 130%;
    border: none;
    box-shadow: none;
    background: transparent;
    background-image: none;	  
  }

  .select-style2 select:focus {
    outline: none;  
  }
  .select-style2 select option {
    padding:3px;
  }
</style>

