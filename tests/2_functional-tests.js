const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

const mongoose = require('mongoose');

const { Issue } = require('../routes/api.js');
const { doc } = require('mocha/lib/reporters/index.js');
const { test } = require('mocha');
const { response } = require('express');

const apiUrl = 'https://3000-freecodecam-boilerplate-ngv1n8embvq.ws-eu116.gitpod.io/api/issues/';
const project = 'apitest';

suite('Functional Tests', function() {
  test('Create an issue with every field', () => {
    return fetch(
      apiUrl + project,
      { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_title: 'Issue with every field',
          issue_text: 'This issue has all the fields filled in.',
          created_by: 'Creator',
          assigned_to: 'Assignee',
          status_text: 'In Analysis'
        })
      }
    )
    .then(response => response.json())
    .then(json => {
      assert.equal(json.issue_title, 'Issue with every field', 'Failure correctly creating an issue with every field (wrong issue title).');
      assert.equal(json.issue_text, 'This issue has all the fields filled in.', 'Failure correctly creating an issue with every field (wrong issue text).');
      assert.equal(json.created_by, 'Creator', 'Failure correctly creating an issue with every field (wrong creator).');
      assert.equal(json.assigned_to, 'Assignee', 'Failure correctly creating an issue with every field (wrong assignee).');
      assert.equal(json.status_text, 'In Analysis', 'Failure correctly creating an issue with every field (wrong status text).');
      assert.equal(json.open, true, 'Failure correctly creating an issue with every field (wrong open/close status).');
      assert.exists(json._id, 'Failure correctly creating an issue with every field (missing issue id).');
      assert.exists(json.created_on, 'Failure correctly creating an issue with every field (missing creation date).');
      assert.exists(json.updated_on, 'Failure correctly creating an issue with every field (missing updating date).');
    });
  });

  test('Create an issue with only required fields', () => {
    return fetch(
      apiUrl + project,
      { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_title: 'Issue with only required fields',
          issue_text: 'This issue has only the required fields filled in.',
          created_by: 'Creator'
        })
      }
    )
    .then(response => response.json())
    .then(json => {
      assert.equal(json.issue_title, 'Issue with only required fields', 'Failure correctly creating an issue with only required fields (wrong issue title).');
      assert.equal(json.issue_text, 'This issue has only the required fields filled in.', 'Failure correctly creating an issue with only required fields (wrong issue text).');
      assert.equal(json.created_by, 'Creator', 'Failure correctly creating an issue with only required fields (wrong creator).');
      assert.equal(json.assigned_to, '', 'Failure correctly creating an issue with only required fields (wrong assignee).');
      assert.equal(json.status_text, '', 'Failure correctly creating an issue with only required fields (wrong status text).');
      assert.equal(json.open, true, 'Failure correctly creating an issue with only required fields (wrong open/close status).');
      assert.exists(json._id, 'Failure correctly creating an issue with only required fields (missing issue id).');
      assert.exists(json.created_on, 'Failure correctly creating an issue with only required fields (missing creation date).');
      assert.exists(json.updated_on, 'Failure correctly creating an issue with only required fields (missing updating date).');
    });    
  });

  test('Create an issue with missing required fields', () => {
    return fetch(
      apiUrl + project,
      { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to: 'Assignee',
          status_text: 'In Analysis'
        })
      }
    )
    .then(response => response.json())
    .then(json => {
      assert.equal(JSON.stringify(json), '{"error":"required field(s) missing"}', 'Failure responding correctly when trying to create an issue with missing fields.');
    });
  });

  test('View issues on a project', () => {
    return fetch(apiUrl + project)
    .then(response => response.json())
    .then(json => {
      assert.isArray(json, 'Failure viewing issues on a project (array not returned).');
      (async () => {
        return await Issue.countDocuments({ project: project });
      })().then(docCount => {
        assert.equal(json.length, docCount, 'Failure viewing issues on a project (array length doesn\'t match).');
      });
    });
  });

  test('View issues on a project with one filter', () => {
    return fetch(apiUrl + project + '?open=true')
    .then(response => response.json())
    .then(json => {
      assert.isArray(json, 'Failure viewing issues on a project with one filter (array not returned).');
      (async () => {
        return await Issue.countDocuments({ project: project, open: true });
      })().then(docCount => {
        assert.equal(json.length, docCount, 'Failure viewing issues on a project with one filter (array length doesn\'t match).');
      });
      assert.isTrue(json.every(issue => issue.open), 'Failure viewing issues on a project with one filter (not all issues have a certain value for a given property)');
    });
  });

  test('View issues on a project with multiple filters', () => {
    const timestamp = new Date().valueOf();
    return fetch(
      apiUrl + project,
      { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_title: 'Title-' + timestamp,
          issue_text: 'Issue created in an automated test to later view issues on a project with multiple filters.',
          created_by: 'Creator-' + timestamp
        })
      }
    )
    .then(() => {
      fetch(apiUrl + project + '?issue_title=Title-' + timestamp + '&created_by=Creator-' + timestamp)
      .then(response => response.json())
      .then(json => {
        assert.isArray(json, 'Failure viewing issues on a project with multiple filters (array not returned).');
        assert.equal(json.length, 1, 'Failure viewing issues on a project with multiple filters (array length doesn\'t match).');
        assert.equal(json[0].issue_title, 'Title-' + timestamp, 'Failure viewing issues on a project with multiple filters (wrong issue title).');
        assert.equal(json[0].created_by, 'Creator-' + timestamp, 'Failure viewing issues on a project with multiple filters (wrong issue text).');
      });
    });
  });

  test('Update one field on an issue', () => {
    return fetch(
      apiUrl + project,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_title: 'Title',
          issue_text: 'Issue created in an automated test to later update a field in it.',
          created_by: 'Creator',
          assigned_to: 'Assignee'
        })
      }
    )
    .then(response => response.json())
    .then(postResponseJson => {
      fetch(
        apiUrl + project,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            _id: postResponseJson._id,
            assigned_to: 'Assignee updated'
          })
        }
      )
      .then(response => response.json())
      .then(putResponseJson => {
        assert.equal(JSON.stringify(putResponseJson), `{"result":"successfully updated","_id":"${postResponseJson._id}"}`, 'Failure updating one field on an issue.');
      });
    });  
  });

  test('Update multiple fields on an issue', () => {
    return fetch(
      apiUrl + project,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          issue_title: 'Title',
          issue_text: 'Issue created in an automated test to later update multiple field in it.',
          created_by: 'Creator',
          status_text: 'In Development'
        })
      }
    )
    .then(response => response.json())
    .then(postResponseJson => {
      fetch(
        apiUrl + project,
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            _id: postResponseJson._id,
            open: false,
            status_text: 'In QA'
          })
        }
      )
      .then(response => response.json())
      .then(putResponseJson => {
        assert.equal(JSON.stringify(putResponseJson), `{"result":"successfully updated","_id":"${postResponseJson._id}"}`, 'Failure updating multiple fields on an issue.');
        assert.equal(postResponseJson._id, putResponseJson._id, 'Failure updating multiple fields on an issue (mismatched issue id).');
        fetch(apiUrl + project + '?_id=' + postResponseJson._id)
        .then(response => response.json())
        .then(getResponseJson => {
          assert.equal(getResponseJson[0].open, false, 'Failure updating multiple fields on an issue (wrong property value)');
          assert.equal(getResponseJson[0].status_text, 'In QA', 'Failure updating multiple fields on an issue (wrong property value)');
        });
      });
    });
  });

  test('Update an issue with missing _id', () => {
    return fetch(
      apiUrl + project,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          issue_title: 'Title'
        })
      }
    )
    .then(response => response.json())
    .then(json => {
      assert.equal(JSON.stringify(json), '{"error":"missing _id"}', 'Failure updating an issue with missing id.');
    });
  });

  test('Update an issue with no fields to update', () => {
    return fetch(
      apiUrl + project,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          _id: '000000000000000000000000'
        })
      }
    )
    .then(response => response.json())
    .then(json => {
      assert.equal(JSON.stringify(json), `{"error":"no update field(s) sent","_id":"000000000000000000000000"}`, 'Failure updating an issue with no fields to update.');
    });
  });

  test('Update an issue with an invalid _id', () => {
    return fetch(
      apiUrl + project,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          _id: '000000000000000000000000',
          issue_text: 'Text'
        })
      }
    )
    .then(response => response.json())
    .then(json => {
      assert.equal(JSON.stringify(json), `{"error":"could not update","_id":"000000000000000000000000"}`, 'Failure updating an issue with an invalid _id.');
    });
  });

  test('Delete an issue', () => {
    return fetch(
      apiUrl + project,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          issue_title: 'To be deleted',
          issue_text: 'Issue created by an automated test only to be deleted later.',
          created_by: 'Creator'
        })
      }
    )
    .then(response => response.json())
    .then(postResponseJson => {
      fetch(
        apiUrl + project,
        {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            _id: postResponseJson._id
          })
        }
      )
      .then(response => response.json())
      .then(deleteResponseJson => {
        assert.equal(JSON.stringify(deleteResponseJson), `{"result":"successfully deleted","_id":"${postResponseJson._id}"}`, 'Failure deleting an issue.');
      });
    });
  });

  test('Delete an issue with an invalid _id', () => {
    return fetch(
      apiUrl + project,
      {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          _id: '000000000000000000000000'
        })
      }
    )
    .then(response => response.json())
    .then(json => {
      assert.equal(JSON.stringify(json), `{"error":"could not delete","_id":"000000000000000000000000"}`, 'Failure deleting an issue with an invalid id.');
    });
  });

  test('Delete an issue with missing _id', () => {
    return fetch(
      apiUrl + project,
      {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify( {} )
      }
    )
    .then(response => response.json())
    .then(json => {
      assert.equal(JSON.stringify(json), `{"error":"missing _id"}`, 'Failure deleting an issue with missing id.');
    });
  });

});
