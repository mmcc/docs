import { Component } from 'react'
import { MDXProvider } from '@mdx-js/tag'
import { withRouter } from 'next/router'
import { useAmp } from 'next/amp'
import debounce from 'lodash.debounce'
import { HEADER_HEIGHT } from '~/lib/constants'
import NextLink from 'next/link'

import * as bodyLocker from '~/lib/utils/body-locker'
import Layout from '~/components/layout/layout'
import Main from '~/components/layout/main'
import changeHash from '~/lib/utils/change-hash'
import components from '~/lib/mdx-components'
import Content from '~/components/layout/content'
import VersionSwitcher from '~/components/layout/version-switcher'
import Context from '~/lib/api/slugs-context'
import DocsRuntime from '~/lib/api/runtime'
import DocsIndex from '~/components/layout/index'
import getFragment from '~/lib/api/get-fragment'
import getHref from '~/lib/api/get-href'
import Head from '~/components/layout/head'
import scrollToElement from '~/lib/utils/scroll-to-element'
import Sidebar from '~/components/layout/sidebar'
import ToggleGroup, { ToggleItem } from '~/components/toggle-group'
import withPermalink from '~/lib/api/with-permalink'
import HR from '~/components/text/hr'
import { FooterFeedback } from '~/components/feedback-input'

import ApiDocs from '~/components/references-mdx/api/v2/index.mdx'

const NonAmpOnly = ({ children }) => (useAmp() ? null : children)

const debouncedChangeHash = debounce(changeHash, 200)

class APIPage extends Component {
  state = {
    activeCategory: 'getting-started',
    activeSection: 'introduction',
    activeEntry: null,
    activeSubEntry: null,
    navigationActive: false,
    version: this.props.router.asPath.split(/(v[0-9])/)[1] || 'v2'
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.activeCategory !== prevState.activeCategory ||
      this.state.activeSection !== prevState.activeSection ||
      this.state.activeEntry !== prevState.activeEntry ||
      this.state.activeSubEntry !== prevState.activeSubEntry
    ) {
      debouncedChangeHash(
        getFragment({
          category: this.state.activeCategory,
          section: this.state.activeSection,
          entry: this.state.activeEntry,
          subEntry: this.state.activeSubEntry
        })
      )
    }
  }

  updateActive = ({
    category = null,
    section = null,
    entry = null,
    subEntry = null
  }) => {
    if (
      this.state.activeCategory !== category ||
      this.state.activeSection !== section ||
      this.state.activeEntry !== entry ||
      this.state.activeSubEntry !== subEntry
    ) {
      this.setState({
        activeCategory: category,
        activeSection: section,
        activeEntry: entry,
        activeSubEntry: subEntry
      })
    }
  }

  setInitiallyActive = ({
    href,
    category = null,
    section = null,
    entry = null,
    subEntry = null
  }) => {
    if (this.props.router.asPath.endsWith(href)) {
      this.updateActive({ category, section, entry, subEntry })
    }
  }

  handleSidebarRef = node => {
    this.sidebarNode = node
  }

  handleEntryActive = entryNode => {
    scrollToElement(this.sidebarNode, entryNode)
  }

  handleSectionActive = sectionNode => {
    if (!this.state.activeEntry) {
      scrollToElement(this.sidebarNode, sectionNode)
    }
  }

  handleVersionChange = event => {
    const href = `/docs/api/${event.target.value}`
    this.props.router.push(href)
    this.handleIndexClick()
  }

  handleIndexClick = () => {
    if (this.state.navigationActive) {
      bodyLocker.unlock()
      this.setState({
        navigationActive: false
      })
    }
  }

  render() {
    const { router } = this.props
    const { navigationActive, version } = this.state
    const active = {
      category: this.state.activeCategory,
      section: this.state.activeSection,
      entry: this.state.activeEntry,
      subEntry: this.state.activeSubEntry
    }

    return (
      <MDXProvider
        components={{
          ...components,
          h1: withPermalink(components.h1),
          h2: withPermalink(components.h2),
          h3: withPermalink(components.h3),
          h4: withPermalink(components.h4)
        }}
      >
        <Layout>
          <Head
            description="A comprehensive guide to using the Now API and gaining control over the Now platform"
            title={`Now API Documentation`}
            titlePrefix=""
            titleSuffix=" - ZEIT"
          />

          <DocsRuntime docs={<ApiDocs />}>
            {({ structure }) => (
              <Main>
                <Sidebar
                  active={navigationActive}
                  innerRef={this.handleSidebarRef}
                  fixed
                >
                  <div className="toggle-group-wrapper">
                    <ToggleGroup>
                      <ToggleItem
                        active={
                          router.pathname.startsWith('/docs') &&
                          !router.pathname.startsWith('/docs/api')
                        }
                      >
                        <NextLink href="/docs">
                          <a onClick={this.handleIndexClick}>Docs</a>
                        </NextLink>
                      </ToggleItem>
                      <ToggleItem
                        active={router.pathname.startsWith('/docs/api')}
                      >
                        <NextLink href="/docs/api">
                          <a onClick={this.handleIndexClick}>API Reference</a>
                        </NextLink>
                      </ToggleItem>
                      <ToggleItem
                        active={router.pathname.startsWith('/examples')}
                      >
                        <NextLink href="/examples">
                          <a onClick={this.handleIndexClick}>Examples</a>
                        </NextLink>
                      </ToggleItem>
                    </ToggleGroup>
                  </div>
                  <DocsIndex
                    activeItem={active}
                    getHref={getHref}
                    onEntryActive={this.handleEntryActive}
                    onSectionActive={this.handleSectionActive}
                    onClickLink={this.handleIndexClick}
                    structure={structure}
                    updateActive={this.updateActive}
                    setInitiallyActive={this.setInitiallyActive}
                  />
                  <div className="select-wrapper">
                    <VersionSwitcher
                      version={version}
                      onChange={this.handleVersionChange}
                    />
                  </div>
                </Sidebar>
                <Content>
                  <div className="content">
                    <div>
                      {structure.map(category => {
                        const categorySlugs = { category: category.slug }
                        return (
                          <div
                            className="category-wrapper"
                            key={getFragment(categorySlugs)}
                          >
                            <span id={getFragment(categorySlugs)} />
                            <Context.Provider
                              value={{
                                slugs: categorySlugs,
                                updateActive: this.updateActive
                              }}
                            >
                              {category.content}
                            </Context.Provider>

                            {category.sections.map(section => {
                              const sectionSlugs = {
                                category: category.slug,
                                section: section.slug
                              }

                              return (
                                <div
                                  className="section-wrapper"
                                  key={getFragment(sectionSlugs)}
                                >
                                  <span id={getFragment(sectionSlugs)} />
                                  <Context.Provider
                                    value={{
                                      slugs: sectionSlugs,
                                      updateActive: this.updateActive
                                    }}
                                  >
                                    {section.content}
                                  </Context.Provider>
                                  <div>
                                    {section.entries.map(entry => {
                                      const entrySlugs = {
                                        category: category.slug,
                                        section: section.slug,
                                        entry: entry.slug
                                      }

                                      return (
                                        <div
                                          className="entry-wrapper"
                                          key={getFragment(entrySlugs)}
                                        >
                                          <span id={getFragment(entrySlugs)} />
                                          <Context.Provider
                                            value={{
                                              slugs: entrySlugs,
                                              updateActive: this.updateActive
                                            }}
                                          >
                                            {entry.content}
                                          </Context.Provider>
                                          <div>
                                            {entry.subEntries.map(subEntry => {
                                              const subEntrySlugs = {
                                                category: category.slug,
                                                section: section.slug,
                                                entry: entry.slug,
                                                subEntry: subEntry.slug
                                              }

                                              return (
                                                <div
                                                  className="entry-wrapper"
                                                  key={getFragment(
                                                    subEntrySlugs
                                                  )}
                                                >
                                                  <span
                                                    id={getFragment(
                                                      subEntrySlugs
                                                    )}
                                                  />
                                                  <Context.Provider
                                                    value={{
                                                      slugs: subEntrySlugs,
                                                      updateActive: this
                                                        .updateActive
                                                    }}
                                                  >
                                                    {subEntry.content}
                                                  </Context.Provider>
                                                </div>
                                              )
                                            })}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <NonAmpOnly>
                    <>
                      <HR />
                      <FooterFeedback />
                    </>
                  </NonAmpOnly>
                </Content>
              </Main>
            )}
          </DocsRuntime>

          <style jsx>{`
            ul {
              list-style: none;
              margin: 0;
              padding: 0;
            }

            .category-wrapper:not(:first-child) {
              padding: 40px 0;
            }

            .category-wrapper:first-child :global(h1) {
              margin-top: 0;
            }

            .category-wrapper:not(:last-child) {
              border-bottom: 1px solid #eaeaea;
            }

            .category-wrapper:last-child {
              padding-bottom: 0;
            }

            .category-wrapper,
            .section-wrapper,
            .entry-wrapper {
              position: relative;
            }

            .entry-wrapper > :global(*:last-child) {
              margin-bottom: 0;
            }

            span {
              position: absolute;
              top: -${HEADER_HEIGHT + 24}px;
            }

            .platform-select-title {
              font-size: var(--font-size-primary);
              line-height: var(--line-height-primary);
              font-weight: bold;
              margin-bottom: 16px;
              margin-top: 0;
            }

            .select-wrapper {
            }

            .toggle-group-wrapper {
              display: none;
            }

            @media screen and (max-width: 950px) {
              .toggle-group-wrapper {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 40px;
              }
            }
          `}</style>
        </Layout>
      </MDXProvider>
    )
  }
}

export default withRouter(APIPage)
