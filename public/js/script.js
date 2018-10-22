/*
 *	Lightestpack main JS
 *
 *	This shit is a mess. Clean it up later
 *
 */

//Check if the .edit list is present on the page -> only true on your own lists
var edit = document.querySelector('.edit');
if(edit != null){

	//Make the big list dragable (categories)
	var parent_list = document.querySelectorAll(".edit ul")[0];
	var editableList = Sortable.create(parent_list, {
		onStart: function (e) {
			var indicator = document.querySelector('.indicator');
			indicator.classList.add('busy');
		},
		onEnd: function (e) {
			save_content();
		}
	});

	//Make the child-list items dragable
	var child_lists = document.querySelectorAll('.edit .child-list');
	for ( var i=0, len = child_lists.length; i < len; i++ ) {
		var editableList = Sortable.create(child_lists[i], {
			group: "child",
			onStart: function (e) {
				var indicator = document.querySelector('.indicator');
				indicator.classList.add('busy');
			},
			onEnd: function (e) {
				save_content();
			}
		});
	}

	//make list title editable
	var list_title = document.querySelector('.list-name');
	list_title.addEventListener('click', function (e) {
		e.preventDefault();
		create_edit_field(e);
	});

	//add link click
	var add_item_links = document.querySelectorAll('.add-item');
	for ( var i=0, len = add_item_links.length; i < len; i++ ) {
		add_item_links[i].addEventListener('click', function (e) {
			e.preventDefault();
			create_new_item(e);
			save_content();
		});
	}

	var add_category_links = document.querySelectorAll('.add-category');
	for ( var i=0, len = add_category_links.length; i < len; i++ ) {
		add_category_links[i].addEventListener('click', function (e) {
			e.preventDefault();
			create_new_category(e);
			save_content();
		});
	}

	refresh_edit_field_events();
}

function refresh_edit_field_events()
{
	var list_fields = document.querySelectorAll('.edit-field');
	for ( var i=0, len = list_fields.length; i < len; i++ ) {

		//make the fields blur on enter/esc
		list_fields[i].addEventListener('keydown', function (e) {
			switch(e.keyCode){
		    	case 13:
		    		//enter
		    		e.preventDefault();
		    		e.currentTarget.blur();
		    	case 27:
		    		//esc
		    		e.preventDefault();
		    		e.currentTarget.blur();
		    }
		});

		//update the indicator when content changed
		list_fields[i].addEventListener('input', function (e) {
			var indicator = document.querySelector('.indicator');
			indicator.classList.add('busy');
		});

		//save content on blur
		list_fields[i].addEventListener('blur', function (e) {
			save_content();
		});
	}

	//Remove on doubleclick
	var rows = document.querySelectorAll('.child-list-item');
	for ( var i=0, len = rows.length; i < len; i++ ) {
		rows[i].addEventListener('dblclick', function (e) {
		    e.currentTarget.remove();
		    save_content();
		});
	}

	//Remove on doubleclick
	var categories = document.querySelectorAll('.category-item');
	for ( var i=0, len = categories.length; i < len; i++ ) {
		categories[i].addEventListener('dblclick', function (e) {
		    e.currentTarget.remove();
		    save_content();
		});
	}
}


/*
function create_edit_field(e)
{
	//only open a new edit if there is no edit open inside the current parent
	var open_edit = e.currentTarget.parentElement.querySelector('.edit-field');
	if(open_edit == null){
		var oc = e.currentTarget.textContent;
		var text_field = document.createElement("input"); 
		text_field.type = 'text';
		text_field.name = 'edit-field';
		text_field.classList.add('edit-field');
		text_field.value = oc;
		text_field.addEventListener('blur', function (e) {
			close_edit();
			save_content();
		});
		e.currentTarget.innerHTML = '';
		e.currentTarget.appendChild(text_field);
		document.querySelector('.edit-field').focus();
	}
	
}
*/
function create_new_item(e)
{
	//create the li
	var new_line = document.createElement("li");
	new_line.classList.add('child-list-item');

	//create all the containers
	var new_line_quantity_field = document.createElement("input");
	new_line_quantity_field.classList.add('edit-field');
	new_line_quantity_field.classList.add('item-quantity');
	new_line_quantity_field.value = '1';
	var new_line_quantity_span = document.createElement("span");
	new_line_quantity_span.classList.add('quantity-multiplier');
	new_line_quantity_span.innerHTML = 'x';
	var new_line_name_field = document.createElement("input");
	new_line_name_field.classList.add('edit-field');
	new_line_name_field.classList.add('item-name');
	new_line_name_field.placeholder = 'Item description';
	var new_line_weight_field = document.createElement("input");
	new_line_weight_field.classList.add('edit-field');
	new_line_weight_field.classList.add('item-weight');
	new_line_weight_field.value = '0';
	var new_line_weight_span = document.createElement("span");
	new_line_weight_span.classList.add('weight-term');
	new_line_weight_span.innerHTML = 'g';

	//append everything
	new_line.append(new_line_quantity_field);
	new_line.append(new_line_quantity_span);
	new_line.append(new_line_name_field);
	new_line.append(new_line_weight_field);
	new_line.append(new_line_weight_span);

	e.currentTarget.parentElement.parentElement.insertBefore(new_line, e.currentTarget.parentElement);
	refresh_edit_field_events();
}

/*

<li class="category-item">
	<div class="category-header">
		<input type="text" class="edit-field category-name" value="{{ category.category_name }}"></input>
		<span class="category-weight">{{ category.total_weight }}g</span>
	</div>
	<ul class="child-list">
		{% for item in category.items %}
			<li class="child-list-item">
				<input type="text" class="edit-field item-quantity" value="{{ item.quantity }}"></input>
				<span class="quantity-multiplier">x</span>
				<input type="text" class="edit-field item-name" value="{{ item.name }}" placeholder="Item description"></input>
				<input type="text" class="edit-field item-weight" value="{{ item.weight }}"></input>
				<span class="weight-term">g</span>
			</li>
	  	{% endfor %}
	  	<li><a href="#" class="add-item">Add</a></li>
  	</ul>
</li>
	*/

function create_new_category(e)
{
	//create the li
	var new_category_item = document.createElement("li");
	new_category_item.classList.add('category-item');

	var new_category_item_header = document.createElement("div");
	new_category_item_header.classList.add('category-header');

	var new_category_item_name = document.createElement("input");
	new_category_item_name.classList.add('edit-field');
	new_category_item_name.classList.add('category-name');
	new_category_item_name.placeholder = "Category name"

	var new_category_item_weight = document.createElement("span");
	new_category_item_weight.classList.add('category-weight');

	new_category_item_header.append(new_category_item_name);
	new_category_item_header.append(new_category_item_weight);

	var new_category_item_child_list = document.createElement("ul");
	new_category_item_child_list.classList.add('child-list');

	var new_category_item_child_list_add = document.createElement("li");
	var new_category_item_child_list_add_link = document.createElement("a");
	new_category_item_child_list_add_link.href = '#';
	new_category_item_child_list_add_link.innerHTML = 'Add item';
	new_category_item_child_list_add_link.classList.add('add-item');
	new_category_item_child_list_add_link.addEventListener('click', function (e) {
		e.preventDefault();
		create_new_item(e);
		save_content();
	});

	new_category_item_child_list_add.append(new_category_item_child_list_add_link);
	new_category_item_child_list.append(new_category_item_child_list_add);


	new_category_item.append(new_category_item_header);
	new_category_item.append(new_category_item_child_list);

	e.currentTarget.parentElement.parentElement.insertBefore(new_category_item, e.currentTarget.parentElement);
	refresh_edit_field_events();
}
/*
function close_edit()
{
	//close an open edit field if there is one
	var open_edit = document.querySelector('.edit-field');
	if(open_edit != null){
		//clean up the previous edit field
		var nc = open_edit.value;
		var parent = open_edit.parentElement;
		open_edit.remove();
		parent.innerHTML = nc;
	}	
}
*/
function save_content()
{
	//get the list id
	var list_container = document.querySelector('.edit');
	var list_id = list_container.dataset.list;

	//get the list name
	var list_name = document.querySelector('.list-name').value;

	//loop over the list and save all content
	var category_lists = document.querySelectorAll('.category-item');
	var categories = { categories: [] };
	var base = 0;
	for (var i = 0; i < category_lists.length; i++) {
	  var category = category_lists[i];
	  var category_object = {};
	  category_object.category_name = category.querySelector('.category-name').value;
	  category_object.items = [];
	  var category_child_list = category.querySelectorAll('.child-list-item');
	  var category_total_weight = 0;
	  for (var p = 0; p < category_child_list.length; p++) {
	  	var item = category_child_list[p];
	  	var item_object = {};
	  	item_object.name = item.querySelector('.item-name').value;
	  	item_object.weight = item.querySelector('.item-weight').value;
	  	item_object.quantity = item.querySelector('.item-quantity').value;
	  	category_object['items'].push(item_object);
	  	category_total_weight += (parseInt(item_object.weight) * parseInt(item_object.quantity));
	  }
	  category.querySelector('.category-weight').innerHTML = category_total_weight+'g';
	  base += category_total_weight;
	  categories.categories.push(category_object);
	}

	//update the base weight
	document.querySelector('.base').innerHTML = (base / 1000).toFixed(1)+'kg';

	//combine all the data
	var output = {};
	output.list_id = list_id;
	output.list_name = list_name;
	output.content = categories;

	//send the save request
	var req = new XMLHttpRequest();
	req.open('POST', '/save', true);
	req.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
	req.send(JSON.stringify(output));
	req.onreadystatechange = function() {
	    if(req.readyState == 4 && req.status == 200) {
	    	var indicator = document.querySelector('.indicator');
	        indicator.classList.remove('busy');
	    }
	}
}

//createing new lists on the /lists page

var create_list_link = document.querySelector('.create-list');
if(create_list_link != null){
	create_list_link.addEventListener('click', function (e) {
		e.preventDefault();
		create_new_list();
	});
}

function create_new_list()
{
	var req = new XMLHttpRequest();
	req.open('GET', '/create', true);
	req.send();
	req.onreadystatechange = function() {
	    if(req.readyState == 4 && req.status == 200) {
	        window.location = "browse/"+req.responseText;
	    }
	}	
}


