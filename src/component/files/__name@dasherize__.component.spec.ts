import { async } from '@angular/core/testing';
import test, { App, expectThat<% if(server) { %>, http, Server<% } %> } from 'ng-test-runner';<% if(fast) { %>
import { speedHack } from '<%= speedHackTemplatePath %>';<% } %>
import { <%= classify(name) %>Component } from './<%= dasherize(name) %>.component';<% if (!skipImport) { %>
import { <%=  moduleClass %> } from '<%= moduleTemplatePath %>'; <% } else { %>
import { NgModule } from '@angular/core';<% } %>

describe('<%= classify(name) %>Component', () => {
  let app: App;<% if(server) { %>
  let server: Server;<% } %>
<% if(fast) { %>
  beforeAll(() => {
    speedHack();
  });
<% } %>
  beforeEach(async(() => {
    app = test(<% if (skipImport) { %>TestModule<% } else { %><%= moduleClass %><% } %>);<% if(server) { %>
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
<% if (skipImport) { %>
@NgModule({
    declarations: [
        <%= classify(name) %>Component
    ]
})
class TestModule {}
<% } %>