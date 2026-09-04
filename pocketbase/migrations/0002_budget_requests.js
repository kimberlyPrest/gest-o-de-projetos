migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const requests = new Collection({
      type: 'base',
      name: 'budget_requests',
      listRule: 'owner = @request.auth.id',
      viewRule: 'owner = @request.auth.id',
      createRule: '@request.auth.id != "" && owner.id = @request.auth.id',
      updateRule: 'owner.id = @request.auth.id',
      deleteRule: 'owner.id = @request.auth.id',
      fields: [
        new RelationField({ name: 'owner', collectionId: users.id, maxSelect: 1, required: true }),
        new TextField({ name: 'title', required: true, max: 180 }),
        new TextField({ name: 'client_name', required: true, max: 180 }),
        new TextField({ name: 'source', required: true, max: 40 }),
        new TextField({ name: 'description', max: 4000 }),
        new TextField({ name: 'technical_notes', max: 4000 }),
        new TextField({ name: 'items', max: 8000 }),
        new NumberField({ name: 'discount_percent', min: 0, max: 100 }),
        new NumberField({ name: 'total_price', min: 0 }),
        new TextField({ name: 'proposal_text', max: 12000 }),
        new TextField({ name: 'approval_notes', max: 4000 }),
        new TextField({ name: 'sent_at', max: 40 }),
        new DateField({ name: 'follow_up_at' }),
        new SelectField({
          name: 'status',
          values: [
            'entrada',
            'entendimento',
            'levantamento',
            'precificacao',
            'proposta',
            'aprovacao',
            'envio',
          ],
          maxSelect: 1,
        }),
        new DateField({ name: 'created_at' }),
      ],
    })
    app.save(requests)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('budget_requests')
    app.delete(collection)
  },
)
