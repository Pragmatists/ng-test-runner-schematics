import { async } from '@angular/core/testing';
import test, { App, expectThat<% if(server) { %>, http, Server<% } %> } from 'ng-test-runner';<% if(fast) { %>
import { speedHack } from '<%= speedHackTemplatePath %>';<% } %>
import { <%= classify(name) %>Component } from './<%= dasherize(name) %>.component';
import { <%=  moduleClass %> } from '<%= moduleTemplatePath %>';

describe('<%= classify(name) %>Component', () => {
  let app: App;<% if(server) { %>
  let server: Server;<% } %>
<% if(fast) { %>
  beforeAll(() => {
    speedHack();
  });
<% } %>
  beforeEach(async(() => {
    app = test(<%= moduleClass %>);<% if(server) { %>
    server = http();<% } %>
  }));
<% if(server) { %>
  afterEach(() => {
    server.stop();
  });
<% } %>
  it('should create component', async(() => {
    const component = app.run(<%= classify(name) %>Component);

    component.verify(
      expectThat.textOf('p').isEqualTo('<%= dasherize(name) %> works!')
    );
  }));
});
