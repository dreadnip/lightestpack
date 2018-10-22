/*
 *	Lightestpack main JS
 *
 *	This shit is a mess. Clean it up later
 *
 */
gear = null;

//Check if the .edit list is present on the page -> only true on your own lists
const edit = document.querySelector('.edit');
if(edit != null){

	//Make the big list dragable (categories)
	const parent_list = document.querySelectorAll(".edit ul")[0];
	const editableList = Sortable.create(parent_list, {
		onStart: function (e) {
			const indicator = document.querySelector('.indicator');
			indicator.classList.add('busy');
		},
		onEnd: function (e) {
			save_content();
		}
	});

	//Make the child-list items dragable
	const child_lists = document.querySelectorAll('.edit .child-list');
	for ( let i=0, len = child_lists.length; i < len; i++ ) {
		const editableList = Sortable.create(child_lists[i], {
			group: "child",
			onStart: function (e) {
				const indicator = document.querySelector('.indicator');
				indicator.classList.add('busy');
			},
			onEnd: function (e) {
				save_content();
			}
		});
	}

	//add link click
	const add_item_links = document.querySelectorAll('.add-item');
	for ( let i=0, len = add_item_links.length; i < len; i++ ) {
		add_item_links[i].addEventListener('click', function (e) {
			e.preventDefault();
			create_new_item(e);
			save_content();
		});
	}

	const add_category_links = document.querySelectorAll('.add-category');
	for ( let i=0, len = add_category_links.length; i < len; i++ ) {
		add_category_links[i].addEventListener('click', function (e) {
			e.preventDefault();
			create_new_category(e);
			save_content();
		});
	}

	//refresh_edit_field_events();
	get_gear();
}

function refresh_edit_field_events()
{
	const list_fields = document.querySelectorAll('.edit-field');
	for ( let i=0, len = list_fields.length; i < len; i++ ) {

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
			const indicator = document.querySelector('.indicator');
			indicator.classList.add('busy');
		});

		//save content on blur
		list_fields[i].addEventListener('blur', function (e) {
			save_content();
		});
	}

	//autocomplete on child list edit fields
	const child_list_edit_fields = document.querySelectorAll('.child-list-item .edit-field');
	for ( let i=0, len = child_list_edit_fields.length; i < len; i++ ) {

		child_list_edit_fields[i].addEventListener('input', function (e) {
		
			//get the entered text for the gear autocomplete
			const input = this.value;

			//if the user enters atleast 2 characters
			if(input.length > 1){

				//create the autocomplete div and append it
				const auto = document.querySelector('.auto');
				if(auto == null) {
					const auto = document.createElement("div");
					auto.classList.add('auto');
					e.currentTarget.parentElement.appendChild(auto);
				}else{
					auto.innerHTML = '';
				}

				//split all the words entered
				let input_array = input.split(" ");

				for ( let i=0, len = gear.length; i < len; i++ ) {
					const gear_item = gear[i];

					for ( let d=0, len = input_array.length; d < len; d++ ) {
						const input_word = input_array[d];

						if(gear_item.gr_string.indexOf(input_word) >= 0){
							const autocomplete_item = document.createElement("span");
							autocomplete_item.classList.add('auto-item');
							autocomplete_item.dataset.name = gear_item.gr_string;
							autocomplete_item.dataset.weight = gear_item.gr_weight;
							autocomplete_item.addEventListener('click', function (e) {
								const auto_name = this.dataset.name;
								const auto_weight = this.dataset.weight;
								this.parentElement.parentElement.querySelector('.item-name').value = auto_name;
								this.parentElement.parentElement.querySelector('.item-weight').value = auto_weight;
								document.querySelector('.auto').remove();
								save_content();
							});
							autocomplete_item.innerHTML = gear_item.gr_string + ' | ' + gear_item.gr_weight;
							document.querySelector('.auto').appendChild(autocomplete_item);
						}
					}
				}
			} else {
				const auto = document.querySelector('.auto');
				if(auto != null) {
					auto.remove();
				}
			}
		});
	}



	//Remove category on doubleclick
	const categories = document.querySelectorAll('.category-header');
	for ( let i=0, len = categories.length; i < len; i++ ) {
		categories[i].addEventListener('dblclick', function (e) {
		    e.currentTarget.remove();
		    save_content();
		});
	}

	//Remove on doubleclick
	const rows = document.querySelectorAll('.child-list-item');
	for ( let i=0, len = rows.length; i < len; i++ ) {
		rows[i].addEventListener('dblclick', function (e) {
		    e.currentTarget.remove();
		    save_content();
		});
	}
}


/*
function create_edit_field(e)
{
	//only open a new edit if there is no edit open inside the current parent
	const open_edit = e.currentTarget.parentElement.querySelector('.edit-field');
	if(open_edit == null){
		const oc = e.currentTarget.textContent;
		const text_field = document.createElement("input"); 
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
	const new_line = document.createElement("li");
	new_line.classList.add('child-list-item');

	//create all the containers
	const new_line_quantity_field = document.createElement("input");
	new_line_quantity_field.classList.add('edit-field');
	new_line_quantity_field.classList.add('item-quantity');
	new_line_quantity_field.value = '1';
	const new_line_quantity_span = document.createElement("span");
	new_line_quantity_span.classList.add('quantity-multiplier');
	new_line_quantity_span.innerHTML = 'x';
	const new_line_name_field = document.createElement("input");
	new_line_name_field.classList.add('edit-field');
	new_line_name_field.classList.add('item-name');
	new_line_name_field.placeholder = 'Item description';
	const new_line_weight_field = document.createElement("input");
	new_line_weight_field.classList.add('edit-field');
	new_line_weight_field.classList.add('item-weight');
	new_line_weight_field.value = '0';
	const new_line_weight_span = document.createElement("span");
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
	const new_category_item = document.createElement("li");
	new_category_item.classList.add('category-item');

	const new_category_item_header = document.createElement("div");
	new_category_item_header.classList.add('category-header');

	const new_category_item_name = document.createElement("input");
	new_category_item_name.classList.add('edit-field');
	new_category_item_name.classList.add('category-name');
	new_category_item_name.placeholder = "Category name"

	const new_category_item_weight = document.createElement("span");
	new_category_item_weight.classList.add('category-weight');

	new_category_item_header.append(new_category_item_name);
	new_category_item_header.append(new_category_item_weight);

	const new_category_item_child_list = document.createElement("ul");
	new_category_item_child_list.classList.add('child-list');

	const new_category_item_child_list_add = document.createElement("li");
	const new_category_item_child_list_add_link = document.createElement("a");
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
	const open_edit = document.querySelector('.edit-field');
	if(open_edit != null){
		//clean up the previous edit field
		const nc = open_edit.value;
		const parent = open_edit.parentElement;
		open_edit.remove();
		parent.innerHTML = nc;
	}	
}
*/
function save_content()
{
	//get the list id
	const list_container = document.querySelector('.edit');
	const list_id = list_container.dataset.list;

	//get the list name
	const list_name = document.querySelector('.list-name').value;

	//loop over the list and save all content
	const category_lists = document.querySelectorAll('.category-item');
	const categories = { categories: [] };
	let base = 0;
	for (let i = 0; i < category_lists.length; i++) {
	  const category = category_lists[i];
	  const category_object = {};
	  category_object.category_name = category.querySelector('.category-name').value;
	  category_object.items = [];
	  const category_child_list = category.querySelectorAll('.child-list-item');
	  let category_total_weight = 0;
	  for (let p = 0; p < category_child_list.length; p++) {
	  	const item = category_child_list[p];
	  	const item_object = {};
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
	const output = {};
	output.list_id = list_id;
	output.list_name = list_name;
	output.content = categories;

	//send the save request
	const req = new XMLHttpRequest();
	req.open('POST', '/save', true);
	req.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
	req.send(JSON.stringify(output));
	req.onreadystatechange = function() {
	    if(req.readyState == 4 && req.status == 200) {
	    	const indicator = document.querySelector('.indicator');
	        indicator.classList.remove('busy');
	    }
	}
}

//createing new lists on the /lists page

const create_list_link = document.querySelector('.create-list');
if(create_list_link != null){
	create_list_link.addEventListener('click', function (e) {
		e.preventDefault();
		create_new_list();
	});
}

function create_new_list()
{
	const req = new XMLHttpRequest();
	req.open('GET', '/create', true);
	req.send();
	req.onreadystatechange = function() {
	    if(req.readyState == 4 && req.status == 200) {
	        window.location = "browse/"+req.responseText;
	    }
	}	
}

function get_gear()
{
	const req = new XMLHttpRequest();
	req.open('GET', '/gear', true);
	req.send();
	req.onreadystatechange = function() {
	    if(req.readyState == 4 && req.status == 200) {
	        gear = JSON.parse(req.responseText);
	        refresh_edit_field_events();
	    }
	}	
}