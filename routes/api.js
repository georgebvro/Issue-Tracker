'use strict';

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

const issueSchema = new mongoose.Schema({
  project: String,
  issue_title: { type: String, required: true },
  issue_text: { type: String, required: true },  
  created_on: { type: Date, required: true },
  updated_on: { type: Date, required: true },
  created_by: { type: String, required: true },
  assigned_to: String,
  open: { type: Boolean, required: true, default: true },
  status_text: String
});

const Issue = mongoose.model('Issue', issueSchema);

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      let project = req.params.project;
      let filter = { project: project };
      if (req.query._id !== undefined) { filter._id = req.query._id };
      if (req.query.issue_title !== undefined) { filter.issue_title = req.query.issue_title };
      if (req.query.issue_text !== undefined) { filter.issue_text = req.query.issue_text };
      if (req.query.created_on !== undefined) { filter.created_on = req.query.created_on };
      if (req.query.updated_on !== undefined) { filter.updated_on = req.query.updated_on };
      if (req.query.created_by !== undefined) { filter.created_by = req.query.created_by };
      if (req.query.assigned_to !== undefined) { filter.assigned_to = req.query.assigned_to };
      if (req.query.open !== undefined) { filter.open = req.query.open };
      if (req.query.status_text !== undefined) { filter.status_text = req.query.status_text };
      (async () => {
        try{
          return await Issue.find(filter);
        }
        catch (err){
          console.error('Error finding issue documents for a certain project:', err);
          throw err;
        }
      })().then(issues => {
        res.json(issues.map(issue => {
          return {
            _id: issue._id, 
            issue_title: issue.issue_title,
            issue_text: issue.issue_text,
            created_on: issue.created_on,
            updated_on: issue.updated_on,
            created_by: issue.created_by,
            assigned_to: issue.assigned_to || '',
            open: issue.open,
            status_text: issue.status_text || ''
          }
        }));
      });
    })
    
    .post(function (req, res){
      let project = req.params.project;
      if (!req.body.issue_title || !req.body.issue_text || !req.body.created_by) {
        res.json({ error: 'required field(s) missing' });
      } else {
          const date = new Date();
          (async () => {
            try {
              return await Issue.create({
                project: project,
                issue_title: req.body.issue_title,
                issue_text: req.body.issue_text,
                created_on: date,
                updated_on: date,
                created_by: req.body.created_by,
                assigned_to: req.body.assigned_to,
                status_text: req.body.status_text
              });
            }
            catch (err) {
              console.error("Error creating issue document:", err);
              throw err;
            }
          }
          )().then(issue => {
            //console.log('issue document created in database:', issue);
            res.json({ 
              _id: issue._id, 
              issue_title: issue.issue_title,
              issue_text: issue.issue_text,
              created_on: issue.created_on,
              updated_on: issue.updated_on,
              created_by: issue.created_by,
              assigned_to: issue.assigned_to || '',
              open: issue.open,
              status_text: issue.status_text || ''
            });
          });
      };
    })
    
    .put(function (req, res){
      let project = req.params.project;
      if (req.body._id === undefined) { res.json({ error: 'missing _id' }); }
      else if (
        !req.body.issue_title && 
        !req.body.issue_text && 
        !req.body.created_by && 
        !req.body.assigned_to && 
        !req.body.open && 
        !req.body.status_text
      ) { res.json({ error: 'no update field(s) sent', _id: req.body._id }); }
      else {
        (async () => {
          let updateProps = {};
          if (req.body.issue_title) { updateProps.issue_title = req.body.issue_title };
          if (req.body.issue_text) { updateProps.issue_text = req.body.issue_text };
          if (req.body.created_by) { updateProps.created_by = req.body.created_by };
          if (req.body.assigned_to) { updateProps.assigned_to = req.body.assigned_to };
          if (req.body.open !== undefined) { updateProps.open = req.body.open };
          if (req.body.status_text) { updateProps.status_text = req.body.status_text };
          updateProps.updated_on = new Date();
          //console.log('updateProps:', updateProps);
          try{
            return await Issue.findOneAndUpdate({ _id: req.body._id }, updateProps);
          }
          catch (err){
            console.error('Error updating issue document:', err);
            throw err;
          }
        })().then(issue => {
          if (issue) res.json({ result: 'successfully updated', _id: issue._id })
          else res.json({ error: 'could not update', _id: req.body._id });
        });
      };
    })
    
    .delete(function (req, res){
      let project = req.params.project;
      if (!req.body._id) res.json({ error: 'missing _id' })
      else {
        (async () => {
          try{
            return await Issue.deleteOne({ _id: req.body._id });
          }
          catch (err){
            console.error('Error deleting issue document:', err);
          }
        })().then(deleteResult => {
          //console.log('deletedCount', deleteResult.deletedCount);
          if (deleteResult.deletedCount) res.json({ result: 'successfully deleted', _id: req.body._id })
          else res.json({ error: 'could not delete', _id: req.body._id });
        });
      };
    });
    
};

module.exports.Issue = Issue;