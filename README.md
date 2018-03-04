# jsoneditor
a web editor of .json file.

## How to use jsoneditor?

### 1. link the css and js in you html.

```html
<link rel="stylesheet" type="text/css" href="jsoneditor.css?v=1.0.0">
<script src="jsoneditor.js?v=1.0.0"></script>
```

### 2. copy the follow html and paste it where you want to use json editor. Note: you can change the id's value, but you shouldn't modify the class. Both of the two html block are required. And you should keep the structure.

```html
<!-- Required!!! Area for displaying json -->
<div id="jsonViewWrap" class="json-view-wrap">
    <div id="jsonView" class="json-view"></div>
</div>
<!-- Required!!! Edit Input: for adding node or editing node. -->
<div id="jsonViewInput" class="json-view-mask json-view-input">
    <form>
        <input type="text" name="dataKey" placeholder="Enter Key" style="width: 61.8%;">
        <br>
        <input type="text" name="dataValue" placeholder="Enter Value">
        <br>
        <div>
            <input type="radio" name="dataType" id="dataType_0" value="string"><label for="dataType_0">string</label>
            <input type="radio" name="dataType" id="dataType_1" value="boolean"><label for="dataType_1">boolean</label>
            <input type="radio" name="dataType" id="dataType_2" value="number"><label for="dataType_2">number</label>
            <input type="radio" name="dataType" id="dataType_3" value="array"><label for="dataType_3">array</label>
        </div>
        <br>
        <button type="submit" class="btn green">OK</button>
    </form>
</div>
```

### 3. code

```javascript
var data = { 
    name: "Singhi John",
    age: 29,
    male: true,
    skills: ["Angular", "Vue", ".NET", "PHP"],
    address: {
        country: "China",
        state: "LiaoNing"
    }
};
var jv = new JsonViewer('jsonViewWrap', 'jsonViewInput', data);
```