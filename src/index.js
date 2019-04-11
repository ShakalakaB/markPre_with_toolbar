import React from 'react';
import ReactDOM from 'react-dom';
import marked from 'marked';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './index.scss';
import './fontawesome';

marked.setOptions({
  breaks: true,
});

// INSERTS target="_blank" INTO HREF TAGS (required for codepen links)
const renderer = new marked.Renderer();
renderer.link = function (href, title, text) {
  return `<a target="_blank" href="${href}">${text}` + '</a>';
}
renderer.code = function(code, language) {
  return '<pre><code class=language-' + language + '>' + code + '</code></pre>';
}
const buttonType={
  'bold':'**',
  'italic':' __ ',
  'quote':'> ',
  'link':'[]()',
  'code':'`',
  'image':'![]()',
  'bulletList':'- ',
  'orderedList':'1. '
};
class Mdpre extends React.Component {
  constructor(props){
    super(props);
    this.state={
      input:defaultText
    }
    this.handleChange=this.handleChange.bind(this);
    this.handleClick=this.handleClick.bind(this);
  }
  
  handleClick(event){
    let buttonName=event.currentTarget.id;
    let inputField=document.getElementsByTagName('textarea').item(0);
    let inputValue=inputField.value;
    let startPos=inputField.selectionStart;
    let endPos=inputField.selectionEnd;
    let selectionText=inputValue.slice(startPos,endPos);
    if (SSM.get('lastAction')=='click' && SSM.get('lastButton')==buttonName){
      let fieldStart=SSM.get('fieldStart');
      let fieldEnd=SSM.get('fieldEnd');
      let lastStart=SSM.get('lastStart');
      let lastEnd=SSM.get('lastEnd');
      this.setState({
        input:inputValue.slice(0,fieldStart)+selectionText+inputValue.slice(fieldEnd)
      });
      setTimeout(()=>selectText(lastStart,lastEnd),1);
      SSM.trackActionStore('undo','');
    }else{
      let markedText=insertButton(buttonName,selectionText);
      this.setState({
        input:inputValue.slice(0,startPos)+markedText+inputValue.slice(endPos)
      });
      trackAction('click',buttonName,startPos,endPos);
      let textStart=SSM.get('textStart');
      let textEnd=SSM.get('textEnd');
        //如果不设置setTimeout,直接运行selectText，将会导致selectText对未更改之前的inputField进行操作
      setTimeout(()=>selectText(textStart,textEnd),1);
      
    }
  }
  
  handleChange(event){
    SSM.trackActionStore('','');
    this.setState({
      input:event.target.value
    });
  }

  render(){
    return(
      <div>
        <div className="col-sm-6" id="editorWrap">
          <Toolbar onClick={this.handleClick} />
          <Editor onChange={this.handleChange} md={this.state.input} />
        </div>
          <Preview text={this.state.input} />
      </div>
    );
  }
}

class SessionStorageManager{
  trackActionStore(action,_buttonName,lastStart,lastEnd,textStart,textEnd,fieldStart,fieldEnd){
    this.lastAction=sessionStorage.setItem('lastAction',action);
    this.lastButton=sessionStorage.setItem('lastButton',_buttonName);
    this.lastStart=sessionStorage.setItem('lastStart',lastStart);
    this.lastEnd=sessionStorage.setItem('lastEnd',lastEnd);
    this.textStart=sessionStorage.setItem('textStart',textStart);
    this.textEnd=sessionStorage.setItem('textEnd',textEnd);
    this.fieldStart=sessionStorage.setItem('fieldStart',fieldStart);
    this.fieldEnd=sessionStorage.setItem('fieldEnd',fieldEnd);
  }
  get(key){
    return sessionStorage.getItem(key);
  }
}
const SSM=new SessionStorageManager();

function selectText(selStart,selEnd){
  let inputField=document.getElementsByTagName('textarea').item(0);
  /*let fullText=inputField.value;
  inputField.value=fullText.substring(0,selEnd);
  inputField.scrollTop=inputField.scrollHeight;
  inputField.value=fullText;*/
  inputField.focus();
  inputField.setSelectionRange(selStart,selEnd);
}

function insertButton(_buttonName,_selectionText){
  let markText,preText,sufText;
  switch(_buttonName){
    case 'link':
    case 'image':
      preText=buttonType[_buttonName].match(/.?\[/)[0].toString();
      sufText=']()';
      markText=preText+_selectionText+sufText;
      return markText;
      break;
    case 'bold':
    case 'code':
      preText=buttonType[_buttonName];
      sufText=buttonType[_buttonName];
      markText=preText+_selectionText+sufText;
      return markText;
      break;
    case 'italic':
      preText=buttonType[_buttonName].match(/._/)[0];
      sufText=buttonType[_buttonName].match(/_ /)[0];
      markText=preText+_selectionText+sufText;
      return markText;
      break;
    case 'quote':
    case 'bulletList':
    case 'orderedList':
      preText=buttonType[_buttonName];
      markText=preText+_selectionText;
      return markText;
      break;
  }
}
function trackAction(action,_buttonName,_startPos,_endPos){
  if (action=='click'){
    switch(_buttonName){
      case 'bold':
        SSM.trackActionStore('click',_buttonName,_startPos,_endPos,_startPos+2,_endPos+2,_startPos,_endPos+4);
        break;
      case 'italic':
        SSM.trackActionStore('click',_buttonName,_startPos,_endPos,_startPos+2,_endPos+2,_startPos,_endPos+4);
        break;
      case 'quote':
        SSM.trackActionStore('click',_buttonName,_startPos,_endPos,_startPos+2,_endPos+2,_startPos,_endPos+2);
        break;
      case 'link':
        SSM.trackActionStore('click',_buttonName,_startPos,_endPos,_startPos+1,_endPos+1,_startPos,_endPos+4);
        break;
      case 'code':
        SSM.trackActionStore('click',_buttonName,_startPos,_endPos,_startPos+1,_endPos+1,_startPos,_endPos+2);
        break;
      case 'image':
        SSM.trackActionStore('click',_buttonName,_startPos,_endPos,_startPos+2,_endPos+2,_startPos,_endPos+5);
        break;
      case 'bulletList':
        SSM.trackActionStore('click',_buttonName,_startPos,_endPos,_startPos+2,_endPos+2,_startPos,_endPos+2);
        break;
      case 'orderedList':
        SSM.trackActionStore('click',_buttonName,_startPos,_endPos,_startPos+3,_endPos+3,_startPos,_endPos+3);
        break;
    }
  }
}

function Toolbar(props){
  return(
    <div  id="toolbar">
      <i title="Bold" id="bold" onClick={props.onClick}>
        <FontAwesomeIcon icon="bold" size="lg"/>
      </i>
      <i title="Italic" id="italic" onClick={props.onClick}>
        <FontAwesomeIcon icon="italic" size="lg"/>
      </i>
      <i title="Quote" id="quote" onClick={props.onClick}>
        <FontAwesomeIcon icon="quote-left" size="lg"/>
      </i>
      <i title="Link" id="link" onClick={props.onClick}>
        <FontAwesomeIcon icon="link" size="lg"/>
      </i>
      <i title="Code" id="code" onClick={props.onClick}>
        <FontAwesomeIcon icon="code" size="lg"/>
      </i>
      <i title="Images" id="image" onClick={props.onClick}>
        <FontAwesomeIcon icon="images" size="lg"/>
      </i>
      <i title="Bulleted List" id="bulletList" onClick={props.onClick}>
        <FontAwesomeIcon icon="list-ul" size="lg"/>
      </i>
      <i title="Numbered List" id="orderedList" onClick={props.onClick}>
        <FontAwesomeIcon icon="list-ol" size="lg"/>
      </i>
    </div>
  );
}
function Editor(props){
  return  <textarea className="col-sm-12" onChange={props.onChange} value={props.md} />;
}

function createMarkup(props) {
  return {__html: props};
}

function Preview(props){
  const markdown=marked(props.text);
  return(
    /*the following sentence just won't work, though it works in 
    https://codepen.io/no_stack_dub_sack/pen/JbPZvm?editors=0110
    <div dangerouslySetInnerHTML={{_html:marked(props.text)}} />*/
    <div  className="col-sm-6" id="preview" dangerouslySetInnerHTML={createMarkup(markdown)} />
  );
}

const defaultText = 
  `
  # Welcome to my React Markdown Previewer!
  
  ## This is a sub-heading...
  ### And here's some other cool stuff:
    
  Heres some code, \`<inline style>\`, between 2 backticks.
  
  \`\`\`
  // this is multi-line code:
  
  function anotherExample(firstLine, lastLine) {
    if (firstLine == '\`\`\`' && lastLine == '\`\`\`') {
      return multiLineCode;
    }
  }
  \`\`\`
    
  You can also make text **bold**... whoa!
  Or _italic_.
  Or... wait for it... **_both!_**
  And feel free to go crazy ~~crossing stuff out~~.
  
  The coolest part is probably the toolbar, so go ahead and check that out. There are libraries out there that embed pre-coded toolbards like [SimpleMDE](https://simplemde.com/), but I decided to try to undertake the challenge myself, so this is definitely not perfect (some scrolling issues), but for the most part it works.
  
  There's also [links](https://www.freecodecamp.com/no-stack-dub-sack), and
  > Block Quotes!
  
  And if you want to get really crazy, even tables:
  
  Wild Header | Crazy Header | Another Header?
  ------------ | ------------- | ------------- 
  Your content can | be here, and it | can be here....
  And here. | Okay. | I think we get it.
  
  - And of course there are lists.
    - Some are bulleted.
       - With differnt indentation levels.
          - That look like this.
  
  
  1. And there are numbererd lists too.
  1. The tool bar keeps adding 1s.
  1. But the list goes on...
  - Even if you use dashes or asterisks.
  * And last but not least, let's not forget embedded images:
  
  ![React Logo w/ Text](https://goo.gl/Umyytc)
  
  Well, that's it! Thanks for visiting my project. The code is in desperate need of a refactor, so maybe I will improve later and add additional functionality like syntax highlighting and fix some of the bugs. For this first round, I was just exploring these techniques and focusing on getting things working. 
  
  Feel free to play around and leave some comments if you have any thoughts!
  `

ReactDOM.render(
  <Mdpre />,
  document.getElementById('app')
);
module.hot.accept();