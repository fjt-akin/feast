
$(function () {
            $(document).scroll(function () {
                var $nav = $("#mainNavbar");
                $nav.toggleClass("scrolled", $(this).scrollTop() > $nav.height());
            });
        });


      //POST COMMENT
	$('#new-comment').submit(function(e){
	e.preventDefault();
	let comment = $(this).serialize();
	let actionUrl = $(this).attr('action')
	$.post(actionUrl, comment, function(data){
		$('#comment-list').append(
		`
         <div class="row">
				<div class="col-md-12">
        <h5 style="font-weight: 700; color: red">${data.currentUser.username}</h5> 
					<span class="float-right">${data.moment}</span>
					<p>${data.comment.text}</p>
${`(${data.currentUser} && ${data.food.author.id}.equals(${data.currentUser._id}) || ${data.currentUser} && ${data.currentUser.isAdmin})` ?


`<a class="btn btn-warning btn-sm" data-toggle="collapse" href="#collapseEdit${data.comment._id}" role="button" aria-expanded="false" aria-controls="collapseEdit">Edit</a>
					
<form id="delete-item-form" class="delete-form" action="/foods/${data.food._id}/comments/${data.comment._id}?_method=DELETE" method="POST">
     <input type="submit" class="btn btn-sm btn-danger" value="Delete">
 </form>

<div class="collapse" id="collapseEdit${data.comment._id}">
  <div class="card card-body">
    <form action="/foods/${data.food._id}/comments/${data.comment._id}" method="POST" class="edit-item-form">
        <div class="form-group">
          <input class="form-control" type="text" disabled value="${data.currentUser.username}">
        </div>
		<div class="form-group">
			<textarea required class="form-control" name="comment[text]" value="${data.comment.text}" rows="3" cols="70"></textarea>
				</div>
        <div class="form-group">
			<button class="btn btn-success">Comment <i class="fas fa-comments"></i></button>
		</div>
      </form>
  </div>
</div> 
<hr>
</div>
</div>` : '' }
		`)
$('#new-comment').find('.form-control').val('');
	}) 
$('.chkcomments').remove()
})




//UPDATE COMMENT
$('#comment-list').on('submit', '.edit-item-form', function(event){
	event.preventDefault();
	let comment = $(this).serialize();
	let actionUrl = $(this).attr('action');
	$originalItem = $(this).closest('.row');
	$.ajax({
		url: actionUrl,
		data: comment,
		type: 'PUT',
		originalItem: $originalItem,
		success: function (data){
			this.originalItem.html(
			`

             <div class="col-md-12">
        <h5 style="font-weight: 700; color: red">${data.currentUser.username}</h5> 
					<span class="float-right">${data.moment}</span>
					<p>${data.comment.text}</p>
${`(${data.currentUser} && ${data.food.author.id}.equals(${data.currentUser._id}) || ${data.currentUser} && ${data.currentUser.isAdmin})` ?


`<a class="btn btn-warning btn-sm" data-toggle="collapse" href="#collapseEdit${data.comment._id}" role="button" aria-expanded="false" aria-controls="collapseEdit">Edit</a>
					
<form class="delete-form" action="/foods/${data.food._id}/comments/${data.comment._id}?_method=DELETE" method="POST">
     <input type="submit" class="btn btn-sm btn-danger" value="Delete">
 </form>

<div class="collapse" id="collapseEdit${data.comment._id}">
  <div class="card card-body">
    <form class="edit-item-form" action="/foods/${data.food._id}/comments/${data.comment._id}" method="POST">
        <div class="form-group">
          <input class="form-control" type="text" disabled value="${data.currentUser.username}">
        </div>
		<div class="form-group">
			<textarea required class="form-control" name="comment[text]" value="${data.comment.text}" rows="5" cols="70"></textarea>
				</div>
        <div class="form-group">
			<button class="btn btn-success">Comment <i class="fas fa-comments"></i></button>
		</div>
      </form>
  </div>
</div>
<hr>
	</div>` : '' }
            `)	
		}
	});
});


//DELETE ROUTE
$('#comment-list').on('submit', '#delete-item-form', function(e){
	e.preventDefault();
	let confirmResponse = confirm('Are you sure?');
	if(confirmResponse){
		let actionUrl = $(this).attr('action');
		$itemToDelete = $(this).closest('.row');
		$.ajax({
			url: actionUrl,
			type: 'DELETE',
			itemToDelete: $itemToDelete,
			success: function(data){
				this.itemToDelete.remove();
			}
		})
	}
	
	
})


//LIKES BUTTON

$('.likeSection').on('submit', '#likeButton', function(e){
	e.preventDefault();
	let actionUrl = $(this).attr('action');
	$originalLike = $(this).parent();
	$.ajax({
		url: actionUrl,
		type: 'POST',
		originalLike: $originalLike,
		success: function(data){
			this.originalLike.html(
		`
         <form action="/foods/${data.food._id}/like" method="POST" id="likeButton">
						<div class="d-flex" role="group">
                        
                       ${`(${data.currentUser} && ${data.food.likes}.some(function (like) {
                                 return like.equals(${data.currentUser._id})
                             }))` ? 
							`<button class="btn btn-sm btn-primary">
								<i class="far fa-thumbs-up"></i> Liked (${data.food.likes.length})
							</button>` :
							
								`<button class="btn btn-sm btn-secondary">
								<i class="far fa-thumbs-up"></i> Like (${data.food.likes.length})
							</button>` }
							
							<button type="button" class="btn btn-primary" data-toggle="modal" 
									datatarget="#foodLikes">See more details</button>
						</div>
					   </form>
        `
		)
			$('#totalLikes').html(
			`
             <button type="button" class="btn btn-primary" data-toggle="modal" 
							data-target="#foodLikes"> <span>Total likes: <i class="far fa-thumbs-up"></i>
						${data.food.likes.length}</span> 
                    </button>
            `)
		}
	})
})
