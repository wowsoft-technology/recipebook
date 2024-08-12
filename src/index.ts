import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import formbody from '@fastify/formbody';  // Importer le plugin

const prisma = new PrismaClient();
const server = Fastify();

// Enregistrer le plugin pour gérer les données du formulaire
server.register(formbody);

// Route pour afficher les recettes sur la page d'accueil
server.get('/', async (request, reply) => {
  try {
    const recipes = await prisma.recipe.findMany();
    let html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <title>Liste des Recettes</title>
          <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
          <link rel="stylesheet" href="/css/styles.css"> <!-- Assurez-vous que ce fichier CSS existe -->
      </head>
      <body>
          <div class="container">
              <h1>Liste des Recettes</h1>
              <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#formModal">Ajouter une Recette</button>
              <div class="list-group">
    `;
    recipes.forEach(recipe => {
      html += `
        <div class="list-group-item">
          <h4 class="list-group-item-heading">${recipe.title}</h4>
          <p class="list-group-item-text">${recipe.description}</p>
          <small>Créé le: ${new Date(recipe.createdAt).toLocaleDateString()}</small>
          <hr>
          <form method="post" action="/deleteRecipe" style="display:inline;">
            <input type="hidden" name="id" value="${recipe.id}">
            <button type="submit" class="btn btn-danger btn-sm">Supprimer</button>
          </form>
          <button class="btn btn-warning btn-sm" data-toggle="modal" data-target="#updateModal" data-id="${recipe.id}" data-title="${recipe.title}" data-description="${recipe.description}">Modifier</button>
        </div>
      `;
    });
    html += `
              </div>
          </div>

          <!-- Add Form Modal -->
          <div class="modal fade" id="formModal" tabindex="-1" role="dialog" aria-labelledby="formModalLabel">
              <div class="modal-dialog" role="document">
                  <div class="modal-content">
                      <form method="post" action="/addRecipe">
                          <div class="modal-header">
                              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                  <span aria-hidden="true">&times;</span>
                              </button>
                              <h4 class="modal-title" id="formModalLabel">Ajouter une Recette</h4>
                          </div>
                          <div class="modal-body">
                              <div class="form-group">
                                  <label>Titre de la Recette</label>
                                  <input type="text" class="form-control" name="title" required />
                              </div>
                              <div class="form-group">
                                  <label>Description</label>
                                  <textarea class="form-control" name="description" required></textarea>
                              </div>
                          </div>
                          <div class="modal-footer">
                              <button type="button" class="btn btn-default" data-dismiss="modal">Fermer</button>
                              <button type="submit" class="btn btn-primary">Enregistrer</button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>

          <!-- Update Form Modal -->
          <div class="modal fade" id="updateModal" tabindex="-1" role="dialog" aria-labelledby="updateModalLabel">
              <div class="modal-dialog" role="document">
                  <div class="modal-content">
                      <form method="post" action="/updateRecipe">
                          <div class="modal-header">
                              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                  <span aria-hidden="true">&times;</span>
                              </button>
                              <h4 class="modal-title" id="updateModalLabel">Modifier une Recette</h4>
                          </div>
                          <div class="modal-body">
                              <div class="form-group">
                                  <input type="hidden" name="id" id="update-id" />
                                  <label>Titre de la Recette</label>
                                  <input type="text" class="form-control" name="title" id="update-title" required />
                              </div>
                              <div class="form-group">
                                  <label>Description</label>
                                  <textarea class="form-control" name="description" id="update-description" required></textarea>
                              </div>
                          </div>
                          <div class="modal-footer">
                              <button type="button" class="btn btn-default" data-dismiss="modal">Fermer</button>
                              <button type="submit" class="btn btn-primary">Enregistrer</button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>

          <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
          <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
          <script>
              $('#updateModal').on('show.bs.modal', function (event) {
                  var button = $(event.relatedTarget);
                  var id = button.data('id');
                  var title = button.data('title');
                  var description = button.data('description');
                  var modal = $(this);
                  modal.find('#update-id').val(id);
                  modal.find('#update-title').val(title);
                  modal.find('#update-description').text(description);
              });
          </script>
      </body>
      </html>
    `;
    reply.type('text/html').send(html);
  } catch (error) {
    reply.status(500).send({ error: 'Erreur lors de la récupération des recettes' });
  }
});

// Route pour ajouter une recette
server.post('/addRecipe', async (request, reply) => {
  try {
    const { title, description } = request.body as { title: string; description: string };
    await prisma.recipe.create({
      data: { title, description }
    });
    reply.redirect('/');
  } catch (error) {
    reply.status(500).send({ error: 'Erreur lors de l\'ajout de la recette' });
  }
});

// Route pour mettre à jour une recette
server.post('/updateRecipe', async (request, reply) => {
  try {
    const { id, title, description } = request.body as { id: string; title: string; description: string };
    await prisma.recipe.update({
      where: { id },
      data: { title, description }
    });
    reply.redirect('/');
  } catch (error) {
    reply.status(500).send({ error: 'Erreur lors de la mise à jour de la recette' });
  }
});

// Route pour supprimer une recette
server.post('/deleteRecipe', async (request, reply) => {
  try {
    const { id } = request.body as { id: string };
    await prisma.recipe.delete({
      where: { id }
    });
    reply.redirect('/');
  } catch (error) {
    reply.status(500).send({ error: 'Erreur lors de la suppression de la recette' });
  }
});

// Démarrer le serveur
server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
